interface InputI {
  placeholder: string
  value: string
  setValue: (value: string) => void
  label: string
}

export default function InputField({
  placeholder,
  value,
  setValue,
  label,
}: InputI) {
  return (
    <div className="mt-[20px]">
      <label htmlFor="" className="text-[10px] font-[600]">
        {label}
      </label>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-[100%] h-[56px] px-[20px]"
        required
      />
    </div>
  )
}
