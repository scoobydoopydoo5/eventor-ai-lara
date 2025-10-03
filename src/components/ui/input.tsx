import * as React from "react";
import { cn } from "@/lib/utils";
import { VoiceInputButton } from "./VoiceInputButton";
import { EnhanceTextButton } from "./EnhanceTextButton";

export interface InputProps extends React.ComponentProps<"input"> {
  enableVoiceInput?: boolean;
  enableEnhance?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, enableVoiceInput = false, enableEnhance = false, ...props }, ref) => {
    const [value, setValue] = React.useState(props.value || '');
    const internalRef = React.useRef<HTMLInputElement>(null);
    const inputRef = ref || internalRef;

    React.useEffect(() => {
      setValue(props.value || '');
    }, [props.value]);

    const handleVoiceTranscript = (transcript: string) => {
      const currentValue = typeof value === 'string' ? value : '';
      const newValue = currentValue ? `${currentValue} ${transcript}` : transcript;
      setValue(newValue);
      
      if (props.onChange) {
        const syntheticEvent = {
          target: { value: newValue },
          currentTarget: { value: newValue },
        } as React.ChangeEvent<HTMLInputElement>;
        props.onChange(syntheticEvent);
      }
    };

    const handleEnhanced = (enhancedText: string) => {
      setValue(enhancedText);
      
      if (props.onChange) {
        const syntheticEvent = {
          target: { value: enhancedText },
          currentTarget: { value: enhancedText },
        } as React.ChangeEvent<HTMLInputElement>;
        props.onChange(syntheticEvent);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    if (!enableVoiceInput && !enableEnhance) {
      return (
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          ref={inputRef}
          {...props}
        />
      );
    }

    return (
      <div className="relative flex items-center gap-1">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            enableVoiceInput || enableEnhance ? "pr-20" : "",
            className,
          )}
          ref={inputRef}
          {...props}
          value={value}
          onChange={handleChange}
        />
        {(enableVoiceInput || enableEnhance) && (
          <div className="absolute right-2 flex items-center gap-1">
            {enableEnhance && (
              <EnhanceTextButton
                text={typeof value === 'string' ? value : ''}
                onEnhanced={handleEnhanced}
              />
            )}
            {enableVoiceInput && (
              <VoiceInputButton onTranscript={handleVoiceTranscript} />
            )}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
