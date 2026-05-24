export default function FormInput({ label, placeholder, value, onChange, readOnly }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field ${readOnly ? "bg-gray-50" : ""}`}
      />
    </div>
  );
}