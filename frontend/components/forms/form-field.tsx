import React from 'react'
import { UseFormReturn, FieldPath, FieldValues } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface BaseFieldProps<T extends FieldValues> {
  name: FieldPath<T>
  label: string
  form: UseFormReturn<T>
  required?: boolean
  className?: string
  description?: string
}

interface InputFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  type?: 'text' | 'email' | 'tel' | 'url' | 'number'
  placeholder?: string
}

interface TextareaFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  rows?: number
}

interface SelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  options?: { value: string; label: string }[]
  error?: string
}

export function FormField<T extends FieldValues>({
  name,
  label,
  form,
  required = false,
  className,
  description,
  type = 'text',
  placeholder,
}: InputFieldProps<T>) {
  const error = form.formState.errors[name]

  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        {...form.register(name, {
          valueAsNumber: type === 'number',
        })}
        className={error ? 'border-red-500' : ''}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error.message?.toString()}</p>
      )}
    </div>
  )
}

export function TextareaField<T extends FieldValues>({
  name,
  label,
  form,
  required = false,
  className,
  description,
  placeholder,
  rows = 3,
}: TextareaFieldProps<T>) {
  const error = form.formState.errors[name]

  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        {...form.register(name)}
        className={error ? 'border-red-500' : ''}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error.message?.toString()}</p>
      )}
    </div>
  )
}

export function SelectField<T extends FieldValues>({
  name,
  label,
  form,
  required = false,
  className,
  description,
  placeholder,
  options,
}: SelectFieldProps<T>) {
  const error = form.formState.errors[name]

  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select
        onValueChange={(value) => form.setValue(name, value, { shouldValidate: true })}
        value={form.watch(name) || ''}
      >
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error.message?.toString()}</p>
      )}
    </div>
  )
}
