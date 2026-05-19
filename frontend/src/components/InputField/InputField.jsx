import './InputField.css'

function InputField({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  trailing,
  hideLabel = false,
  dataCy,
}) {
  return (
    <div className="campo">
      <label
        className={`campo-label${hideLabel ? ' campo-label--oculto' : ''}`}
        htmlFor={id}
      >
        {label}
      </label>
      <div className={`campo-controle${error ? ' campo-controle--erro' : ''}`}>
        <input
          id={id}
          name={name}
          className="campo-input"
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : 'false'}
          data-cy={dataCy}
        />
        {trailing ? <div className="campo-adorno">{trailing}</div> : null}
      </div>
    </div>
  )
}

export default InputField
