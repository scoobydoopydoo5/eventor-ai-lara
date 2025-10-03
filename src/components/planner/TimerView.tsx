import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase-typed';

interface TimerViewProps {
  event: any;
  tasks: any[];
}

interface TimerSettings {
  timer_style: string;
  show_progress_bar: boolean;
  background_color: string;
  font_color: string;
  font_family: string;
  font_size: number;
  show_months: boolean;
  show_days: boolean;
  show_hours: boolean;
  show_minutes: boolean;
  show_seconds: boolean;
}

export function TimerView({ event, tasks }: TimerViewProps) {
  const [timeLeft, setTimeLeft] = useState({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isEventDay, setIsEventDay] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>({
    timer_style: 'digital',
    show_progress_bar: true,
    background_color: '#3b82f6',
    font_color: '#ffffff',
    font_family: 'Inter',
    font_size: 64,
    show_months: false,
    show_days: true,
    show_hours: true,
    show_minutes: true,
    show_seconds: true,
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!event?.id) return;
      
      try {
        const { data, error } = await (supabase as any)
          .from('timer_settings')
          .select('*')
          .eq('event_id', event.id)
          .maybeSingle();

        if (data && !error) {
          setSettings(data);
        } else if (!error) {
          // Create default settings if none exist
          const defaultSettings = {
            event_id: event.id,
            timer_style: 'digital',
            show_progress_bar: true,
            background_color: '#3b82f6',
            font_color: '#ffffff',
            font_family: 'Inter',
            font_size: 64,
            show_months: false,
            show_days: true,
            show_hours: true,
            show_minutes: true,
            show_seconds: true,
          };
          
          const { data: newData, error: createError } = await (supabase as any)
            .from('timer_settings')
            .insert([defaultSettings])
            .select()
            .single();

          if (!createError && newData) {
            setSettings(newData);
          }
        }
      } catch (error) {
        console.error('Error loading timer settings:', error);
      }
    };

    loadSettings();
    
    // Set up realtime subscription for settings updates
    const channel = (supabase as any)
      .channel('timer_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timer_settings',
          filter: `event_id=eq.${event.id}`
        },
        (payload: any) => {
          if (payload.new) {
            setSettings(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [event?.id]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const eventDate = new Date(event.event_date);
      if (event.event_time) {
        const [hours, minutes] = event.event_time.split(':');
        eventDate.setHours(parseInt(hours), parseInt(minutes));
      }

      const now = new Date();
      const difference = eventDate.getTime() - now.getTime();

      if (difference <= 0) {
        setIsEventDay(true);
        setTimeLeft({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        let totalSeconds = Math.floor(difference / 1000);
        let totalMinutes = Math.floor(totalSeconds / 60);
        let totalHours = Math.floor(totalMinutes / 60);
        let totalDays = Math.floor(totalHours / 24);
        let totalMonths = Math.floor(totalDays / 30);
        
        const months = settings.show_months ? totalMonths : 0;
        const days = settings.show_months ? totalDays - (totalMonths * 30) : totalDays;
        const hours = settings.show_hours ? totalHours % 24 : 0;
        const minutes = settings.show_minutes ? totalMinutes % 60 : 0;
        const seconds = settings.show_seconds ? totalSeconds % 60 : 0;
        
        // Convert units when disabled
        let displayMonths = months;
        let displayDays = days;
        let displayHours = hours;
        let displayMinutes = minutes;
        let displaySeconds = seconds;
        
        if (!settings.show_seconds) {
          displayMinutes = totalMinutes % 60;
        }
        if (!settings.show_minutes) {
          displayHours = totalHours % 24;
        }
        if (!settings.show_hours) {
          displayDays = totalDays % (settings.show_months ? 30 : 999999);
        }
        if (!settings.show_days && !settings.show_months) {
          displayHours = totalHours;
        }
        
        setTimeLeft({ 
          months: displayMonths, 
          days: displayDays, 
          hours: displayHours, 
          minutes: displayMinutes, 
          seconds: displaySeconds 
        });
        setIsEventDay(false);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [event, settings]);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const timeUnits = [
    { value: timeLeft.months, label: 'Months', show: settings.show_months },
    { value: timeLeft.days, label: 'Days', show: settings.show_days },
    { value: timeLeft.hours, label: 'Hours', show: settings.show_hours },
    { value: timeLeft.minutes, label: 'Minutes', show: settings.show_minutes },
    { value: timeLeft.seconds, label: 'Seconds', show: settings.show_seconds },
  ].filter(unit => unit.show);

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[500px] space-y-8 rounded-lg p-8"
      style={{ 
        backgroundColor: settings.background_color,
        fontFamily: settings.font_family,
      }}
    >
      <div className="text-center space-y-4">
        <h3 
          className="text-2xl font-bold"
          style={{ color: settings.font_color }}
        >
          {event.name} Countdown
        </h3>
        
        {isEventDay ? (
          <div className="space-y-4">
            <div 
              className="font-bold animate-pulse"
              style={{ 
                fontSize: `${settings.font_size}px`,
                color: settings.font_color 
              }}
            >
              Event Day!
            </div>
            <p 
              className="text-xl"
              style={{ color: settings.font_color, opacity: 0.8 }}
            >
              Good luck with your event!
            </p>
          </div>
        ) : (
          <div 
            className="flex gap-4 mt-8 flex-wrap justify-center"
            style={{ gridTemplateColumns: `repeat(${timeUnits.length}, minmax(0, 1fr))` }}
          >
            {timeUnits.map((unit) => (
              <Card 
                key={unit.label}
                className="p-6 text-center"
                style={{ 
                  backgroundColor: `${settings.background_color}dd`,
                  borderColor: settings.font_color + '33'
                }}
              >
                <div 
                  className="font-bold"
                  style={{ 
                    fontSize: `${settings.font_size}px`,
                    color: settings.font_color 
                  }}
                >
                  {unit.value}
                </div>
                <div 
                  className="text-sm mt-2"
                  style={{ color: settings.font_color, opacity: 0.7 }}
                >
                  {unit.label}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {settings.show_progress_bar && (
        <Card 
          className="w-full max-w-md p-6 space-y-4"
          style={{ 
            backgroundColor: `${settings.background_color}dd`,
            borderColor: settings.font_color + '33'
          }}
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: settings.font_color, opacity: 0.7 }}>Task Progress</span>
              <span style={{ color: settings.font_color }} className="font-medium">{completedTasks} / {totalTasks}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: settings.font_color + '22' }}>
            <div>
              <p className="text-xs" style={{ color: settings.font_color, opacity: 0.7 }}>Event Date</p>
              <p className="font-medium" style={{ color: settings.font_color }}>{new Date(event.event_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: settings.font_color, opacity: 0.7 }}>Event Time</p>
              <p className="font-medium" style={{ color: settings.font_color }}>{event.event_time || 'Not set'}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
