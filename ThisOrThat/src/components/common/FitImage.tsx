interface Props {
  src: string;
  alt?: string;
  className?: string; // sizing/aspect for the container (e.g. "aspect-[16/10] w-full")
  imgClassName?: string; // extra classes for the foreground image (e.g. hover transforms)
}

// Shows the WHOLE image (object-contain) so nothing is cropped/squashed, and fills the
// empty side/top gaps with a blurred, zoomed copy of the same image so the box blends in.
export function FitImage({ src, alt = '', className = '', imgClassName = '' }: Props) {
  return (
    <div className={`relative overflow-hidden bg-neutral-900 ${className}`}>
      <img
        aria-hidden
        src={src}
        className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl opacity-50"
      />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`relative h-full w-full object-contain ${imgClassName}`}
      />
    </div>
  );
}
