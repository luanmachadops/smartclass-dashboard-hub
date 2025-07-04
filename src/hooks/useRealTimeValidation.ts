import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { debounce } from 'lodash';

/**
 * Configurações de validação em tempo real
 */
export interface ValidationConfig {
  debounceMs: number;
  validateOnChange: boolean;
  validateOnBlur: boolean;
  showErrorsImmediately: boolean;
}

const DEFAULT_CONFIG: ValidationConfig = {
  debounceMs: 300,
  validateOnChange: true,
  validateOnBlur: true,
  showErrorsImmediately: false
};

/**
 * Estado de validação para um campo
 */
export interface FieldValidationState {
  value: any;
  error: string | null;
  isValid: boolean;
  isTouched: boolean;
  isValidating: boolean;
}

/**
 * Hook para validação em tempo real
 */
export function useRealTimeValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialValues: T,
  config: Partial<ValidationConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Estado dos campos
  const [fields, setFields] = useState<Record<keyof T, FieldValidationState>>(() => {
    const initialFields: Record<keyof T, FieldValidationState> = {} as any;
    
    Object.keys(initialValues).forEach(key => {
      initialFields[key as keyof T] = {
        value: initialValues[key as keyof T],
        error: null,
        isValid: true,
        isTouched: false,
        isValidating: false
      };
    });
    
    return initialFields;
  });
  
  // Estado geral do formulário
  const [formState, setFormState] = useState({
    isValid: true,
    isSubmitting: false,
    hasErrors: false,
    touchedFields: new Set<keyof T>()
  });
  
  /**
   * Valida um campo específico
   */
  const validateField = useCallback(async (fieldName: keyof T, value: any): Promise<string | null> => {
    try {
      // Criar um objeto parcial para validação
      const partialData = { ...getValues(), [fieldName]: value };
      
      // Tentar validar o schema completo
      await schema.parseAsync(partialData);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => 
          err.path.includes(fieldName as string)
        );
        return fieldError?.message || null;
      }
      return 'Erro de validação';
    }
  }, [schema]);
  
  /**
   * Validação com debounce
   */
  const debouncedValidate = useCallback(
    debounce(async (fieldName: keyof T, value: any) => {
      setFields(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          isValidating: true
        }
      }));
      
      const error = await validateField(fieldName, value);
      
      setFields(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          error,
          isValid: !error,
          isValidating: false
        }
      }));
    }, finalConfig.debounceMs),
    [validateField, finalConfig.debounceMs]
  );
  
  /**
   * Atualiza o valor de um campo
   */
  const setValue = useCallback((fieldName: keyof T, value: any) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        isTouched: true
      }
    }));
    
    setFormState(prev => ({
      ...prev,
      touchedFields: new Set([...prev.touchedFields, fieldName])
    }));
    
    if (finalConfig.validateOnChange) {
      debouncedValidate(fieldName, value);
    }
  }, [debouncedValidate, finalConfig.validateOnChange]);
  
  /**
   * Marca um campo como tocado e valida se necessário
   */
  const setTouched = useCallback((fieldName: keyof T) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isTouched: true
      }
    }));
    
    if (finalConfig.validateOnBlur) {
      const currentValue = fields[fieldName].value;
      debouncedValidate(fieldName, currentValue);
    }
  }, [fields, debouncedValidate, finalConfig.validateOnBlur]);
  
  /**
   * Obtém todos os valores atuais
   */
  const getValues = useCallback((): T => {
    const values: Partial<T> = {};
    Object.keys(fields).forEach(key => {
      values[key as keyof T] = fields[key as keyof T].value;
    });
    return values as T;
  }, [fields]);
  
  /**
   * Valida todo o formulário
   */
  const validateForm = useCallback(async (): Promise<boolean> => {
    setFormState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      const values = getValues();
      await schema.parseAsync(values);
      
      // Marcar todos os campos como válidos
      setFields(prev => {
        const newFields = { ...prev };
        Object.keys(newFields).forEach(key => {
          newFields[key as keyof T] = {
            ...newFields[key as keyof T],
            error: null,
            isValid: true,
            isTouched: true
          };
        });
        return newFields;
      });
      
      setFormState(prev => ({
        ...prev,
        isValid: true,
        hasErrors: false,
        isSubmitting: false
      }));
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Atualizar erros nos campos
        setFields(prev => {
          const newFields = { ...prev };
          
          // Limpar erros existentes
          Object.keys(newFields).forEach(key => {
            newFields[key as keyof T] = {
              ...newFields[key as keyof T],
              error: null,
              isValid: true,
              isTouched: true
            };
          });
          
          // Aplicar novos erros
          error.errors.forEach(err => {
            const fieldName = err.path[0] as keyof T;
            if (newFields[fieldName]) {
              newFields[fieldName] = {
                ...newFields[fieldName],
                error: err.message,
                isValid: false
              };
            }
          });
          
          return newFields;
        });
      }
      
      setFormState(prev => ({
        ...prev,
        isValid: false,
        hasErrors: true,
        isSubmitting: false
      }));
      
      return false;
    }
  }, [schema, getValues]);
  
  /**
   * Reset do formulário
   */
  const reset = useCallback((newValues?: Partial<T>) => {
    const resetValues = newValues || initialValues;
    
    setFields(prev => {
      const newFields = { ...prev };
      Object.keys(resetValues).forEach(key => {
        newFields[key as keyof T] = {
          value: resetValues[key as keyof T],
          error: null,
          isValid: true,
          isTouched: false,
          isValidating: false
        };
      });
      return newFields;
    });
    
    setFormState({
      isValid: true,
      isSubmitting: false,
      hasErrors: false,
      touchedFields: new Set()
    });
  }, [initialValues]);
  
  /**
   * Obtém props para um campo específico
   */
  const getFieldProps = useCallback((fieldName: keyof T) => {
    const field = fields[fieldName];
    
    return {
      value: field.value,
      error: (field.isTouched || finalConfig.showErrorsImmediately) ? field.error : null,
      isValid: field.isValid,
      isTouched: field.isTouched,
      isValidating: field.isValidating,
      onChange: (value: any) => setValue(fieldName, value),
      onBlur: () => setTouched(fieldName)
    };
  }, [fields, setValue, setTouched, finalConfig.showErrorsImmediately]);
  
  // Atualizar estado geral quando campos mudam
  useEffect(() => {
    const hasErrors = Object.values(fields).some(field => field.error !== null);
    const isValid = Object.values(fields).every(field => field.isValid);
    
    setFormState(prev => ({
      ...prev,
      hasErrors,
      isValid
    }));
  }, [fields]);
  
  return {
    fields,
    formState,
    setValue,
    setTouched,
    getValues,
    validateForm,
    reset,
    getFieldProps,
    
    // Helpers
    isFieldValid: (fieldName: keyof T) => fields[fieldName].isValid,
    getFieldError: (fieldName: keyof T) => fields[fieldName].error,
    isFieldTouched: (fieldName: keyof T) => fields[fieldName].isTouched,
    isFieldValidating: (fieldName: keyof T) => fields[fieldName].isValidating
  };
}

/**
 * Hook para validação de campo único
 */
export function useFieldValidation<T>(
  validator: (value: T) => Promise<string | null> | string | null,
  initialValue: T,
  config: Partial<ValidationConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<FieldValidationState>({
    value: initialValue,
    error: null,
    isValid: true,
    isTouched: false,
    isValidating: false
  });
  
  const debouncedValidate = useCallback(
    debounce(async (value: T) => {
      setState(prev => ({ ...prev, isValidating: true }));
      
      try {
        const error = await validator(value);
        setState(prev => ({
          ...prev,
          error,
          isValid: !error,
          isValidating: false
        }));
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: 'Erro de validação',
          isValid: false,
          isValidating: false
        }));
      }
    }, finalConfig.debounceMs),
    [validator, finalConfig.debounceMs]
  );
  
  const setValue = useCallback((value: T) => {
    setState(prev => ({
      ...prev,
      value,
      isTouched: true
    }));
    
    if (finalConfig.validateOnChange) {
      debouncedValidate(value);
    }
  }, [debouncedValidate, finalConfig.validateOnChange]);
  
  const setTouched = useCallback(() => {
    setState(prev => ({ ...prev, isTouched: true }));
    
    if (finalConfig.validateOnBlur) {
      debouncedValidate(state.value);
    }
  }, [debouncedValidate, finalConfig.validateOnBlur, state.value]);
  
  return {
    ...state,
    setValue,
    setTouched,
    props: {
      value: state.value,
      error: (state.isTouched || finalConfig.showErrorsImmediately) ? state.error : null,
      onChange: setValue,
      onBlur: setTouched
    }
  };
}