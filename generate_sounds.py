import numpy as np
import scipy.io.wavfile as wav

# Define parameters
sample_rate = 44100  # CD quality audio

# Generate a monster roar sound (low-pitched, deep growl with decay)
def generate_roar_sound(duration=2.0):
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    freq1, freq2 = 60, 90  # Deep frequencies
    roar = 0.6 * np.sin(2 * np.pi * freq1 * t) + 0.4 * np.sin(2 * np.pi * freq2 * t)
    roar *= np.exp(-2 * t)  # Apply decay for a natural fade
    roar = (roar * 32767).astype(np.int16)  # Convert to 16-bit PCM
    return roar

# Generate a destruction sound (crumbling debris with impact noise)
def generate_destroy_sound(duration=1.5):
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    impact = np.random.uniform(-1, 1, t.shape) * np.exp(-3 * t)  # Random noise with decay
    impact = (impact * 32767).astype(np.int16)
    return impact

# Create the audio files
roar_sound_path = "roar.wav"
destroy_sound_path = "destroy.wav"

wav.write(roar_sound_path, sample_rate, generate_roar_sound())
wav.write(destroy_sound_path, sample_rate, generate_destroy_sound())

# Provide file paths
(roar_sound_path, destroy_sound_path)