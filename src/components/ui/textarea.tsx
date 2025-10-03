import * as React from "react";
import { cn } from "@/lib/utils";
import { VoiceInputButton } from "./VoiceInputButton";
import { EnhanceTextButton } from "./EnhanceTextButton";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  enableVoiceInput?: boolean;
  enableEnhance?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, enableVoiceInput = false, enableEnhance = false, ...props }, ref) => {
    const [value, setValue] = React.useState(props.value || '');
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const textareaRef = ref || internalRef;

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
        } as React.ChangeEvent<HTMLTextAreaElement>;
        props.onChange(syntheticEvent);
      }
    };

    const handleEnhanced = (enhancedText: string) => {
      setValue(enhancedText);
      
      if (props.onChange) {
        const syntheticEvent = {
          target: { value: enhancedText },
          currentTarget: { value: enhancedText },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        props.onChange(syntheticEvent);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    if (!enableVoiceInput && !enableEnhance) {
      return (
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          ref={textareaRef}
          {...props}
        />
      );
    }

    return (
      <div className="relative">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            enableVoiceInput || enableEnhance ? "pr-20" : "",
            className,
          )}
          ref={textareaRef}
          {...props}
          value={value}
          onChange={handleChange}
        />
        {(enableVoiceInput || enableEnhance) && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
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
Textarea.displayName = "Textarea";

export { Textarea };
