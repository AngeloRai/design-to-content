// Reusable form UI components that can be used in both server and client components

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-4 py-3 rounded-lg border border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none ${className}`}
      {...props}
    />
  )
}

export function Label({ children, htmlFor, className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label 
      htmlFor={htmlFor} 
      className={`block text-sm font-body-bold mb-1 ${className}`}
      {...props}
    >
      {children}
    </label>
  )
}

export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-4 py-3 rounded-lg border border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-vertical min-h-[120px] ${className}`}
      {...props}
    />
  )
}

export function Select({ children, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full px-4 py-3 rounded-lg border border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}