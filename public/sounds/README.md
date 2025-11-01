# Sound Files for Pulss Notification System

This directory contains audio files used by the notification system:

- `new-order.mp3` - Alert sound for new orders (admins)
- `notification.mp3` - General notification sound
- `success.mp3` - Success confirmation sound  
- `error.mp3` - Error alert sound
- `urgent.mp3` - Urgent notification sound

## Adding Custom Sounds

Admins can upload custom ringtones through the settings panel. Supported formats:
- MP3 (recommended)
- WAV
- OGG

## Technical Notes

- Sounds are preloaded for instant playback
- Volume, duration, and looping can be configured per notification type
- Falls back to browser default sounds if files are missing
- All sounds should be under 5MB for optimal performance