/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Custom colors for emotion states
      colors: {
        'emotion': {
          'anxious': {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
          'sad': {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
          },
          'happy': {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
          },
          'neutral': {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
          }
        },
        // Custom colors for heart rate states
        'heartrate': {
          'high': '#dc2626',
          'normal': '#059669',
          'low': '#2563eb',
        },
        // Audio visualization colors
        'audio': {
          'positive': '#10b981',
          'negative': '#ef4444',
          'neutral': '#6b7280',
          'volume': '#3b82f6',
        },
        // Breathing exercise colors
        'breathing': {
          'inhale': '#3b82f6',
          'hold': '#f59e0b',
          'exhale': '#10b981',
          'rest': '#8b5cf6',
        }
      },
      
      // Custom animations
      animation: {
        'heartbeat': 'heartbeat 1.2s ease-in-out infinite',
        'breathe': 'breathe 8s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'audio-wave': 'audioWave 1.5s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      
      // Custom keyframes
      keyframes: {
        heartbeat: {
          '0%, 100%': { 
            transform: 'scale(1)', 
            opacity: '1' 
          },
          '25%': { 
            transform: 'scale(1.1)', 
            opacity: '0.9' 
          },
          '50%': { 
            transform: 'scale(1.05)', 
            opacity: '1' 
          },
          '75%': { 
            transform: 'scale(1.15)', 
            opacity: '0.8' 
          },
        },
        breathe: {
          '0%, 100%': { 
            transform: 'scale(1)', 
            opacity: '0.8' 
          },
          '50%': { 
            transform: 'scale(1.2)', 
            opacity: '1' 
          },
        },
        'pulse-ring': {
          '0%': {
            transform: 'scale(1)',
            opacity: '1'
          },
          '100%': {
            transform: 'scale(2.5)',
            opacity: '0'
          }
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0)'
          },
          '50%': {
            transform: 'translateY(-10px)'
          }
        },
        fadeIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        slideIn: {
          'from': {
            transform: 'translateX(-100%)'
          },
          'to': {
            transform: 'translateX(0)'
          }
        },
        bounceGentle: {
          '0%, 20%, 53%, 80%, 100%': {
            transform: 'translate3d(0, 0, 0)'
          },
          '40%, 43%': {
            transform: 'translate3d(0, -15px, 0)'
          },
          '70%': {
            transform: 'translate3d(0, -7px, 0)'
          },
          '90%': {
            transform: 'translate3d(0, -2px, 0)'
          }
        },
        shimmer: {
          '0%': {
            'background-position': '-468px 0'
          },
          '100%': {
            'background-position': '468px 0'
          }
        },
        audioWave: {
          '0%, 100%': {
            transform: 'scaleY(1)',
            opacity: '0.5'
          },
          '50%': {
            transform: 'scaleY(0.3)',
            opacity: '1'
          }
        }
      },
      
      // Custom spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Custom border radius
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      
      // Custom box shadows
      boxShadow: {
        'emotion': '0 10px 25px rgba(0, 0, 0, 0.1)',
        'heartrate': '0 0 20px rgba(239, 68, 68, 0.3)',
        'breathing': '0 0 30px rgba(59, 130, 246, 0.2)',
        'glass': '0 8px 32px rgba(31, 38, 135, 0.37)',
        'xl-colored': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      
      // Custom gradients
      backgroundImage: {
        'gradient-emotion-anxious': 'linear-gradient(135deg, #fee2e2, #fca5a5, #ef4444)',
        'gradient-emotion-sad': 'linear-gradient(135deg, #dbeafe, #93c5fd, #3b82f6)',
        'gradient-emotion-happy': 'linear-gradient(135deg, #d1fae5, #6ee7b7, #10b981)',
        'gradient-emotion-neutral': 'linear-gradient(135deg, #f3f4f6, #d1d5db, #6b7280)',
        'gradient-breathing': 'linear-gradient(45deg, #a2d5f2, #7fb3d3)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        'shimmer': 'linear-gradient(to right, #eeeeee 8%, #dddddd 18%, #eeeeee 33%)',
      },
      
      // Custom backdrop blur
      backdropBlur: {
        'xs': '2px',
        '4xl': '72px',
      },
      
      // Custom font sizes
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      
      // Custom z-index values
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      
      // Custom max width
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      
      // Custom min height
      minHeight: {
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
      },
      
      // Custom aspect ratios
      aspectRatio: {
        '4/3': '4 / 3',
        '3/2': '3 / 2',
        '2/3': '2 / 3',
        '9/16': '9 / 16',
      },
      
      // Custom typography
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        'mono': ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      
      // Custom transitions
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
      },
      
      // Custom transform origin
      transformOrigin: {
        'center-center': '50% 50%',
      },
    },
  },
  plugins: [
    // Tailwind Forms plugin for better form styling
    require('@tailwindcss/forms')({
      strategy: 'class', // Use class-based strategy
    }),
    
    // Custom plugin for emotion utilities
    function({ addUtilities, theme }) {
      const emotionUtilities = {
        '.emotion-anxious': {
          color: theme('colors.emotion.anxious.600'),
          backgroundColor: theme('colors.emotion.anxious.50'),
          borderColor: theme('colors.emotion.anxious.200'),
        },
        '.emotion-sad': {
          color: theme('colors.emotion.sad.600'),
          backgroundColor: theme('colors.emotion.sad.50'),
          borderColor: theme('colors.emotion.sad.200'),
        },
        '.emotion-happy': {
          color: theme('colors.emotion.happy.600'),
          backgroundColor: theme('colors.emotion.happy.50'),
          borderColor: theme('colors.emotion.happy.200'),
        },
        '.emotion-neutral': {
          color: theme('colors.emotion.neutral.600'),
          backgroundColor: theme('colors.emotion.neutral.50'),
          borderColor: theme('colors.emotion.neutral.200'),
        },
      }
      
      addUtilities(emotionUtilities)
    },
    
    // Custom plugin for glassmorphism effects
    function({ addUtilities }) {
      const glassUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }
      
      addUtilities(glassUtilities)
    },
  ],
  
  // Dark mode configuration
  darkMode: 'class', // Enable dark mode with class strategy
  
  // Safelist classes that might be dynamically generated
  safelist: [
    'emotion-anxious',
    'emotion-sad', 
    'emotion-happy',
    'emotion-neutral',
    'animate-heartbeat',
    'animate-breathe',
    'animate-pulse-ring',
    'bg-gradient-emotion-anxious',
    'bg-gradient-emotion-sad',
    'bg-gradient-emotion-happy',
    'bg-gradient-emotion-neutral',
  ]
}