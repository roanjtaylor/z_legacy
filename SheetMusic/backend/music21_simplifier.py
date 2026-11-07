"""
Music simplification module using music21 library.

Provides melody extraction (skyline algorithm) and rhythm simplification
for generating progressive difficulty levels of sheet music.
"""

from typing import Dict, List, Tuple, Optional
from music21 import converter, stream, note, chord, meter, key, tempo as m21tempo
from music21 import duration as m21duration
import xml.etree.ElementTree as ET
from io import StringIO


def analyze_complexity(musicxml_content: str) -> Dict:
    """
    Analyze the complexity of a piece to determine available difficulty levels.

    Returns:
        {
            'available_levels': ['easy', 'medium', 'original'] or subset,
            'is_simple': bool,
            'complexity_score': int (0-100),
            'complexity': {
                'voice_count': int,
                'has_grace_notes': bool,
                'has_tuplets': bool,
                'has_polyphony': bool,
                'notes_per_measure': float,
                'total_notes': int,
                'total_measures': int
            }
        }
    """
    try:
        score = converter.parse(musicxml_content)
    except Exception as e:
        # If parsing fails, return simple defaults
        return {
            'available_levels': ['original'],
            'is_simple': True,
            'complexity_score': 0,
            'complexity': {
                'voice_count': 1,
                'has_grace_notes': False,
                'has_tuplets': False,
                'has_polyphony': False,
                'notes_per_measure': 0,
                'total_notes': 0,
                'total_measures': 0
            }
        }

    # Count voices across all parts
    voice_set = set()
    grace_note_count = 0
    tuplet_count = 0
    total_notes = 0
    polyphony_detected = False

    for part_idx, part in enumerate(score.parts):
        for measure in part.getElementsByClass('Measure'):
            # Check for multiple voices in same measure
            voices_in_measure = set()
            for el in measure.recurse().notesAndRests:
                if hasattr(el, 'voice') and el.voice is not None:
                    voices_in_measure.add(el.voice)

                if isinstance(el, (note.Note, chord.Chord)):
                    total_notes += 1
                    voice_key = (part_idx, getattr(el, 'voice', 0))
                    voice_set.add(voice_key)

                    # Check for grace notes
                    if isinstance(el, note.Note) and el.duration.isGrace:
                        grace_note_count += 1

                    # Check for tuplets
                    if el.duration.tuplets:
                        tuplet_count += 1

            # Polyphony = more than one voice in same measure on same staff
            if len(voices_in_measure) > 1:
                polyphony_detected = True

    # Count measures
    total_measures = 0
    if score.parts:
        total_measures = len(score.parts[0].getElementsByClass('Measure'))

    # Calculate notes per measure
    notes_per_measure = total_notes / max(total_measures, 1)

    # Calculate complexity score
    voice_count = len(voice_set)
    complexity_score = 0

    # Voice count scoring (max 30 points)
    if voice_count > 1:
        complexity_score += min(30, (voice_count - 1) * 10)

    # Grace notes (10 points)
    if grace_note_count > 0:
        complexity_score += 10

    # Tuplets (10 points)
    if tuplet_count > 0:
        complexity_score += 10

    # Polyphony (20 points)
    if polyphony_detected:
        complexity_score += 20

    # High note density (15 points) - more than 4 notes per measure per voice
    if notes_per_measure > 4 * max(voice_count, 1):
        complexity_score += 15

    # Determine available levels based on score
    if complexity_score < 20:
        available_levels = ['original']
        is_simple = True
    elif complexity_score < 50:
        available_levels = ['easy', 'original']
        is_simple = False
    else:
        available_levels = ['easy', 'medium', 'original']
        is_simple = False

    return {
        'available_levels': available_levels,
        'is_simple': is_simple,
        'complexity_score': complexity_score,
        'complexity': {
            'voice_count': voice_count,
            'has_grace_notes': grace_note_count > 0,
            'has_tuplets': tuplet_count > 0,
            'has_polyphony': polyphony_detected,
            'notes_per_measure': round(notes_per_measure, 2),
            'total_notes': total_notes,
            'total_measures': total_measures
        }
    }


def extract_melody_skyline(score: stream.Score) -> stream.Part:
    """
    Extract melody using the skyline algorithm (keeps highest note at each position).

    The skyline algorithm is a standard approach for melody extraction from
    polyphonic music - it assumes the melody is typically the highest voice.

    Args:
        score: A music21 Score object

    Returns:
        A new Part containing only the melody notes
    """
    melody = stream.Part()
    melody.id = 'Melody'

    # Copy time signature and key signature from original
    for part in score.parts:
        for el in part.recurse():
            if isinstance(el, meter.TimeSignature):
                melody.insert(0, el)
                break
        for el in part.recurse():
            if isinstance(el, key.KeySignature):
                melody.insert(0, el)
                break
        break  # Only need from first part

    # Use chordify to align all notes by offset
    try:
        chordified = score.chordify()
    except Exception:
        # If chordify fails, try to extract from first part only
        if score.parts:
            return _extract_from_single_part(score.parts[0])
        return melody

    current_measure = None
    measure_number = 1

    for element in chordified.recurse().notesAndRests:
        # Create measures as needed
        if current_measure is None or element.offset >= current_measure.offset + current_measure.quarterLength:
            if current_measure is not None:
                melody.append(current_measure)
                measure_number += 1
            current_measure = stream.Measure(number=measure_number)
            # Get the time signature's quarter length for measure duration
            ts = melody.recurse().getElementsByClass(meter.TimeSignature)
            if ts:
                current_measure.quarterLength = ts[0].barDuration.quarterLength
            else:
                current_measure.quarterLength = 4.0  # Default 4/4

        if isinstance(element, note.Rest):
            new_rest = note.Rest(quarterLength=element.quarterLength)
            current_measure.append(new_rest)
        elif isinstance(element, chord.Chord):
            # Get the highest note from the chord
            highest = element.sortAscending()[-1]
            new_note = note.Note(highest.pitch)
            new_note.duration = element.duration
            new_note.quarterLength = element.quarterLength
            current_measure.append(new_note)
        elif isinstance(element, note.Note):
            new_note = note.Note(element.pitch)
            new_note.duration = element.duration
            new_note.quarterLength = element.quarterLength
            current_measure.append(new_note)

    # Add the last measure
    if current_measure is not None and len(current_measure) > 0:
        melody.append(current_measure)

    return melody


def _extract_from_single_part(part: stream.Part) -> stream.Part:
    """Fallback: extract melody from a single part by keeping highest notes."""
    melody = stream.Part()
    melody.id = 'Melody'

    for measure in part.getElementsByClass('Measure'):
        new_measure = stream.Measure(number=measure.number)

        # Group notes by offset
        notes_by_offset = {}
        for el in measure.recurse().notesAndRests:
            offset = el.offset
            if offset not in notes_by_offset:
                notes_by_offset[offset] = []
            notes_by_offset[offset].append(el)

        # Keep highest note at each offset
        for offset in sorted(notes_by_offset.keys()):
            elements = notes_by_offset[offset]
            notes_only = [e for e in elements if isinstance(e, note.Note)]

            if notes_only:
                highest = max(notes_only, key=lambda n: n.pitch.midi)
                new_note = note.Note(highest.pitch)
                new_note.duration = highest.duration
                new_measure.insert(offset, new_note)
            elif elements and isinstance(elements[0], note.Rest):
                new_rest = note.Rest(quarterLength=elements[0].quarterLength)
                new_measure.insert(offset, new_rest)

        melody.append(new_measure)

    return melody


def extract_bass_line(score: stream.Score) -> stream.Part:
    """
    Extract bass line (lowest notes) for medium difficulty.

    Args:
        score: A music21 Score object

    Returns:
        A new Part containing the bass notes (root notes of harmonies)
    """
    bass = stream.Part()
    bass.id = 'Bass'

    try:
        chordified = score.chordify()
    except Exception:
        return bass

    for element in chordified.recurse().notesAndRests:
        if isinstance(element, note.Rest):
            bass.append(note.Rest(quarterLength=element.quarterLength))
        elif isinstance(element, chord.Chord):
            # Get the lowest note (bass/root)
            lowest = element.sortAscending()[0]
            new_note = note.Note(lowest.pitch)
            new_note.duration = element.duration
            bass.append(new_note)
        elif isinstance(element, note.Note):
            new_note = note.Note(element.pitch)
            new_note.duration = element.duration
            bass.append(new_note)

    return bass


def remove_grace_notes(part: stream.Part) -> stream.Part:
    """Remove all grace notes from a part."""
    cleaned = stream.Part()
    cleaned.id = part.id

    for element in part.recurse():
        if isinstance(element, stream.Measure):
            new_measure = stream.Measure(number=element.number)
            for el in element.notesAndRests:
                if isinstance(el, note.Note):
                    if not el.duration.isGrace:
                        new_note = note.Note(el.pitch)
                        new_note.duration = el.duration
                        new_measure.append(new_note)
                elif isinstance(el, note.Rest):
                    new_measure.append(note.Rest(quarterLength=el.quarterLength))
                elif isinstance(el, chord.Chord):
                    new_chord = chord.Chord([p for p in el.pitches])
                    new_chord.duration = el.duration
                    new_measure.append(new_chord)
            cleaned.append(new_measure)
        elif isinstance(element, (meter.TimeSignature, key.KeySignature)):
            cleaned.insert(0, element)

    return cleaned


def simplify_tuplets(part: stream.Part) -> stream.Part:
    """
    Simplify tuplets to nearest standard subdivisions.

    Converts triplets and other tuplets to regular note values,
    preserving the general rhythmic feel while reducing complexity.
    """
    simplified = stream.Part()
    simplified.id = part.id

    # Standard note durations in quarter lengths
    standard_durations = [4.0, 3.0, 2.0, 1.5, 1.0, 0.75, 0.5, 0.375, 0.25, 0.125]

    for element in part.recurse():
        if isinstance(element, stream.Measure):
            new_measure = stream.Measure(number=element.number)

            for el in element.notesAndRests:
                if isinstance(el, (note.Note, chord.Chord)):
                    # Check if this note has tuplet modifications
                    if el.duration.tuplets:
                        # Get actual duration and round to nearest standard
                        actual_ql = el.duration.quarterLength
                        nearest = min(standard_durations, key=lambda x: abs(x - actual_ql))

                        if isinstance(el, note.Note):
                            new_el = note.Note(el.pitch)
                        else:
                            new_el = chord.Chord([p for p in el.pitches])

                        new_el.duration = m21duration.Duration(quarterLength=nearest)
                        new_measure.append(new_el)
                    else:
                        # No tuplet, keep as is
                        if isinstance(el, note.Note):
                            new_note = note.Note(el.pitch)
                            new_note.duration = el.duration
                            new_measure.append(new_note)
                        else:
                            new_chord = chord.Chord([p for p in el.pitches])
                            new_chord.duration = el.duration
                            new_measure.append(new_chord)
                elif isinstance(el, note.Rest):
                    new_measure.append(note.Rest(quarterLength=el.quarterLength))

            simplified.append(new_measure)
        elif isinstance(element, (meter.TimeSignature, key.KeySignature)):
            simplified.insert(0, element)

    return simplified


def generate_simplified_musicxml(musicxml_content: str, level: str) -> Tuple[str, List[str]]:
    """
    Generate a simplified MusicXML version at the specified level.

    Levels:
    - 'easy': Melody only, no grace notes, simplified tuplets
    - 'medium': Melody + bass line, no grace notes
    - 'original': Unchanged (returns input)

    Args:
        musicxml_content: Original MusicXML string
        level: 'easy', 'medium', or 'original'

    Returns:
        Tuple of (simplified_musicxml_string, list_of_warnings)
    """
    warnings = []

    if level == 'original':
        return musicxml_content, warnings

    try:
        score = converter.parse(musicxml_content)
    except Exception as e:
        warnings.append(f"Failed to parse MusicXML: {str(e)}")
        return musicxml_content, warnings

    # Create new score for simplified version
    simplified_score = stream.Score()

    # Copy metadata if available
    if score.metadata:
        simplified_score.metadata = score.metadata

    if level == 'easy':
        # Extract melody only
        melody = extract_melody_skyline(score)

        # Remove grace notes
        melody = remove_grace_notes(melody)

        # Simplify tuplets
        melody = simplify_tuplets(melody)

        simplified_score.insert(0, melody)
        warnings.append("Easy level: Melody only, grace notes removed, tuplets simplified")

    elif level == 'medium':
        # Extract melody and bass
        melody = extract_melody_skyline(score)
        bass = extract_bass_line(score)

        # Remove grace notes from both
        melody = remove_grace_notes(melody)
        bass = remove_grace_notes(bass)

        # Create a piano part with treble and bass
        simplified_score.insert(0, melody)
        if len(bass) > 0:
            simplified_score.insert(0, bass)

        warnings.append("Medium level: Melody + bass, grace notes removed")

    # Convert back to MusicXML
    try:
        # Write to a string
        musicxml_output = simplified_score.write('musicxml')

        # Read the file content
        with open(musicxml_output, 'r', encoding='utf-8') as f:
            result = f.read()

        # Clean up temp file
        import os
        os.remove(musicxml_output)

        return result, warnings

    except Exception as e:
        warnings.append(f"Failed to generate simplified MusicXML: {str(e)}")
        return musicxml_content, warnings


def detect_available_levels(musicxml_content: str) -> List[str]:
    """
    Convenience function to determine which difficulty levels should be available.

    Args:
        musicxml_content: MusicXML string

    Returns:
        List of available levels, e.g., ['easy', 'medium', 'original']
    """
    analysis = analyze_complexity(musicxml_content)
    return analysis['available_levels']
