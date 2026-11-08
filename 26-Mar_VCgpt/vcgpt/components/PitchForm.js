"use client";

import { examples } from "@/data/examples";

export default function PitchForm({ onSubmit, loading }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onSubmit({
      idea: formData.get("idea"),
      customer: formData.get("customer"),
      revenue: formData.get("revenue"),
      whyNow: formData.get("whyNow"),
    });
  };

  const fillExample = (example) => {
    document.getElementById("idea").value = example.idea;
    document.getElementById("customer").value = example.customer;
    document.getElementById("revenue").value = example.revenue;
    document.getElementById("whyNow").value = example.whyNow;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-base text-muted mb-3">Try an example pitch:</p>
        <div className="flex flex-wrap gap-3">
          {examples.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => fillExample(ex)}
              disabled={loading}
              className="px-5 py-2 text-base rounded-full border border-border text-foreground hover:bg-accent hover:text-white hover:border-accent disabled:opacity-40 transition-all cursor-pointer"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <Field
        id="idea"
        label="Startup Idea"
        placeholder="Describe your startup idea..."
        disabled={loading}
      />
      <Field
        id="customer"
        label="Target Customer"
        placeholder="Who is your target customer?"
        disabled={loading}
      />
      <Field
        id="revenue"
        label="Revenue Model"
        placeholder="How will you make money?"
        disabled={loading}
      />
      <Field
        id="whyNow"
        label="Why Now"
        placeholder="Why is now the right time for this?"
        disabled={loading}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer mt-2"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analysing Pitch...
          </span>
        ) : (
          "Submit for Analysis"
        )}
      </button>
    </form>
  );
}

function Field({ id, label, placeholder, disabled }) {
  return (
    <div>
      <label htmlFor={id} className="block text-base font-medium text-foreground mb-2">
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        placeholder={placeholder}
        disabled={disabled}
        required
        rows={2}
        className="w-full appearance-none bg-white border-2 border-gray-900 text-foreground text-base p-3 rounded-lg placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none resize-none disabled:opacity-40 transition-all"
      />
    </div>
  );
}
