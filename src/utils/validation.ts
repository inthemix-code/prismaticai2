/**
 * Frontend validation utilities
 * These complement the backend validation but should not be relied upon for security
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate search prompt on the frontend
 * @param prompt - The user input prompt
 * @returns Validation result
 */
export function validatePrompt(prompt: string): ValidationResult {
  const errors: string[] = [];
  
  // Check if prompt is empty or only whitespace
  if (!prompt || !prompt.trim()) {
    errors.push('Prompt cannot be empty');
  }
  
  // Check prompt length
  if (prompt.length > 2000) {
    errors.push('Prompt cannot exceed 2000 characters');
  }
  
  if (prompt.length < 1) {
    errors.push('Prompt must be at least 1 character long');
  }
  
  // Check for potentially malicious content
  const dangerousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /onclick|onload|onerror|onmouseover/gi
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(prompt)) {
      errors.push('Prompt contains potentially unsafe content');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate selected models
 * @param selectedModels - Object containing model selections
 * @returns Validation result
 */
export function validateSelectedModels(selectedModels: Record<string, boolean>): ValidationResult {
  const errors: string[] = [];
  const allowedModels = ['claude', 'grok', 'gemini'];
  
  // Check if selectedModels is an object
  if (!selectedModels || typeof selectedModels !== 'object') {
    errors.push('Model selection must be an object');
    return { isValid: false, errors };
  }
  
  // Check for invalid model names
  const providedModels = Object.keys(selectedModels);
  for (const model of providedModels) {
    if (!allowedModels.includes(model)) {
      errors.push(`Invalid model: ${model}`);
    }
    
    if (typeof selectedModels[model] !== 'boolean') {
      errors.push(`Model selection for ${model} must be boolean`);
    }
  }
  
  // Check if at least one model is selected
  const selectedCount = Object.values(selectedModels).filter(Boolean).length;
  if (selectedCount === 0) {
    errors.push('At least one model must be selected');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize user input by removing potentially dangerous characters
 * @param input - Raw user input
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove potentially dangerous characters
    .replace(/[<>"']/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ');
}

/**
 * Validate and sanitize a complete search request
 * @param prompt - User prompt
 * @param selectedModels - Selected AI models
 * @returns Validation result with sanitized data
 */
export function validateSearchRequest(
  prompt: string, 
  selectedModels: Record<string, boolean>
): ValidationResult & { sanitizedPrompt?: string } {
  const promptValidation = validatePrompt(prompt);
  const modelsValidation = validateSelectedModels(selectedModels);
  
  const allErrors = [...promptValidation.errors, ...modelsValidation.errors];
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    sanitizedPrompt: allErrors.length === 0 ? sanitizeInput(prompt) : undefined
  };
}