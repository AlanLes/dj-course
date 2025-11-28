import tkinter as tk
from tkinter import messagebox, scrolledtext, ttk
import pyaudio
import wave
import os
import time
import threading
import queue
import sys
import logging
import logging.handlers
from typing import TextIO

# --- Global Configuration ---
APP_TITLE = "Azor Transcriber"
# Set to True to print output to the console (standard output/stderr).
VERBOSE = False
LOG_FILENAME = "transcriber.log"

# --- Logging Setup ---
class StreamToLogger(TextIO):
    """
    Fake file-like stream object that redirects writes to a logger instance.
    This captures stdout/stderr, including print() statements.
    """
    def __init__(self, logger, level):
        self.logger = logger
        self.level = level
        self.linebuf = ''

    def write(self, buf):
        # Handle buffer and write line by line
        for line in buf.rstrip().splitlines():
            # Check if the line is not empty (prevents logging empty lines from print())
            if line.strip():
                self.logger.log(self.level, line.strip())

    def flush(self):
        # Required by TextIO interface, but we flush line-by-line in write
        pass

# Configure the global logger BEFORE application startup
def setup_logging():
    """Con gures the logging system to save all output to a le and optionally to console."""
    os.makedirs('output', exist_ok=True)
    
    # 1. Root logger setup
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO) # Capture everything from INFO level up

    # 2. File Handler (Always active)
    file_handler = logging.handlers.RotatingFileHandler(
        LOG_FILENAME, 
        maxBytes=1024*1024*5, # 5 MB per file
        backupCount=5,
        encoding='utf-8'
    )
    # Define a simple formatter for the file
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)

    # 3. Console Handler (Only active if VERBOSE is True)
    if VERBOSE:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
    
    # 4. Redirect stdout and stderr to the logger
    sys.stdout = StreamToLogger(root_logger, logging.INFO)
    sys.stderr = StreamToLogger(root_logger, logging.ERROR)

setup_logging()
logging.info("Application initialization started.")

# --- Whisper Dependencies ---
# Ensure you have installed: pip install torch transformers librosa
# (Librosa might require ffmpeg)
try:
    import torch
    from transformers import pipeline
except ImportError:
    logging.error("ERROR: 'transformers' or 'torch' libraries not found.")
    logging.error("Install them using: pip install torch transformers")
    exit()

# === 1. Transcription Configuration ===
MODEL_NAME = "openai/whisper-tiny"

def output_filename()  -> str:
    """Generates output filename for transcription results."""
    os.makedirs('output', exist_ok=True)
    return f"output/recording-{int(time.time())}.wav"

def transcribe_audio(audio_path: str, model_name: str) -> str:
    """
    Loads the Whisper model and transcribes the audio file.
    This function is blocking and should be run in a separate thread.
    """
    try:
        logging.info(f"Loading model: {model_name}...")
        # Initialize pipeline
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        logging.info(f"Using device: {device}")
        
        asr_pipeline = pipeline(
            "automatic-speech-recognition", 
            model=model_name,
            device=device
        )

        logging.info(f"Starting transcription for file: {audio_path}...")
        result = asr_pipeline(audio_path)
        
        transcription = result["text"].strip()
        
        logging.info("Transcription finished.")
        return transcription

    except FileNotFoundError:
        logging.error(f"ERROR: Audio file not found at path: {audio_path}")
        return f"ERROR: Audio file not found at path: {audio_path}"
    except Exception as e:
        logging.error(f"An unexpected error occurred during transcription: {e}", exc_info=True)
        return f"An unexpected error occurred during transcription: {e}"


# === 2. Recording Configuration ===
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000  # Standard for speech models (Whisper)
MAX_RECORD_DURATION = 30 # Maximum recording length in seconds

# === 3. Tkinter GUI Application ===
class AudioRecorderApp:
    def __init__(self, master):
        self.master = master
        
        # 1. Set application title (window title)
        master.title(APP_TITLE)
        
        # 2. Set the application name for the OS/taskbar
        # This is cross-platform attempt to set the application name
        try:
            # For macOS and some X11 environments
            self.master.tk.call('wm', 'iconname', self.master._w, APP_TITLE)
        except tk.TclError:
            # Standard method, usually works on Windows/Linux
            self.master.wm_iconname(APP_TITLE)
            
        master.geometry("600x450") # Slightly larger window
        master.config(bg="#121212") # Set dark background for root

        # --- TKINTER WIDGET STYLES (ttk) ---
        style = ttk.Style()
        style.theme_use('default') 

        # Configure the dark background for the Notebook tabs
        style.configure('TNotebook', background='#121212', borderwidth=0)
        style.configure('TNotebook.Tab', background='#1E1E1E', foreground='white', borderwidth=0)
        style.map('TNotebook.Tab', background=[('selected', '#0F0F0F')], foreground=[('selected', 'white')])

        # 1. Define new style for dark gray buttons
        style.configure('Dark.TButton',
                        background='#333333',    
                        foreground='white',     
                        font=('Arial', 14),
                        bordercolor='#333333',
                        borderwidth=0,
                        focuscolor='#333333',
                        padding=(20, 10, 20, 10) 
                       )
        
        # 2. Define button appearance in different states (active/disabled)
        style.map('Dark.TButton',
                  background=[('active', '#555555'), # Lighter gray for hover/active state
                              ('disabled', '#333333')], # Disabled state uses the default background
                 )

        logging.info("GUI initialization started.")

        # Initialize PyAudio
        try:
            self.p = pyaudio.PyAudio()
        except Exception as e:
            logging.critical(f"Could not initialize PyAudio: {e}. Destroying GUI.")
            messagebox.showerror("PyAudio Error", f"Could not initialize PyAudio: {e}\nDo you have 'portaudio' installed?")
            master.destroy()
            return
            
        self.frames = []
        self.stream = None
        self.recording = False
        self.start_time = None
        self.record_timer_id = None 

        # Queue for inter-thread communication
        self.transcription_queue = queue.Queue()
        
        # --- TAB MENU SETUP (Notebook) ---
        self.notebook = ttk.Notebook(master, style='TNotebook')
        self.notebook.pack(pady=10, padx=10, fill='both', expand=True)

        # 1. Transcriber Tab
        self.transcriber_frame = tk.Frame(self.notebook, bg="#121212") # Set dark background for frame
        self.notebook.add(self.transcriber_frame, text='Transcriber')

        # 2. History Tab
        self.history_frame = tk.Frame(self.notebook, bg="#121212") # Consistent dark background
        self.notebook.add(self.history_frame, text='Transcription History')
        
        # === SPLIT VIEW: PanedWindow (horizontal) ===
        self.history_paned = tk.PanedWindow(
            self.history_frame, 
            orient=tk.HORIZONTAL,
            bg="#121212",
            borderwidth=0,
            sashwidth=5,
            sashpad=5,
            sashrelief=tk.RAISED,
            sashcursor="hand2",
            sashcolor="#333333",
            sashrelief=tk.RAISED,
            sashcursor="hand2",
            sashcolor="#333333",
        )
        self.history_paned.pack(pady=10, padx=20, fill=tk.BOTH, expand=True)

        # === LEFT PANEL: Transcription listbox ===
        left_panel = tk.Frame(self.history_paned, bg="#121212")
        self.history_paned.add(left_panel, minsize=150)

        # Label above the listbox
        tk.Label(
            left_panel,
            text="Transcription History",
            font=('Arial', 12, 'bold'),
            fg='white',
            bg="#121212"
        ).pack(anchor="w", pady=(0, 5))

        # Listbox for transcription history
        listbox_frame = tk.Frame(left_panel, bg="#121212")
        listbox_frame.pack(fill=tk.BOTH, expand=True)

        self.history_listbox = tk.Listbox(
            listbox_frame,
            bg="#1E1E1E",
            fg='white',
            font=('Arial', 11),
            selectbackground='#333333',
            selectforeground='white'
        )
        self.history_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Scrollbar for the listbox
        history_scrollbar = tk.Scrollbar(listbox_frame, command=self.history_listbox.yview)
        history_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.history_listbox.config(yscrollcommand=history_scrollbar.set)

        # Delete button
        delete_button = ttk.Button(left_panel,
        text="Delete Selected",
        command=self.on_delete_selected,
        style='Dark.TButton'
    )
        delete_button.pack(fill=tk.X, pady=(10, 0))

        # === RIGHT PANEL: History Display ===
        right_panel = tk.Frame(self.history_paned, bg="#121212")
        self.history_paned.add(right_panel, minsize=200)

        tk.Label(
            right_panel,
            text="Last transcription:",
            font=('Arial', 12, 'bold'),
            fg='white',
            bg="#121212"
        ).pack(anchor="w", pady=(10, 5))

        self.history_preview = tk.Text(
            right_panel,
            wrap=tk.WORD,
            font=('Arial', 11),
            bg='#1E1E1E',
            fg='white',
            insertbackground='white',
            state=tk.DISABLED
        )
        
        self.history_preview.pack(fill=tk.BOTH, expand=True)

        # === EVENT BINDING: clicking on a listbox item updates the preview ===
        self.history_listbox.bind('<<ListboxSelect>>', self.on_history_select)

        # List to store data (timestamp for every element)
        self.history_data = []
        self.refresh_history_list()

        # 3. Settings Tab
        self.settings_frame = tk.Frame(self.notebook, bg="#121212") 
        self.notebook.add(self.settings_frame, text='Settings')

        # Content for Settings Tab
        tk.Label(self.settings_frame, text="Under construction...", font=('Arial', 18), fg='gray', bg="#121212").pack(pady=50)


        # --- Transcriber Tab Elements ---
        
        # Record Button
        self.record_button = ttk.Button(self.transcriber_frame, 
                                        text="Record", 
                                        command=self.toggle_recording, 
                                        style='Dark.TButton')
        self.record_button.pack(pady=20, fill=tk.X, padx=20) 

        # Transcribed Text Display (Read-only Text widget)
        self.transcription_display = tk.Text(self.transcriber_frame, 
                                             height=10, 
                                             wrap=tk.WORD, 
                                             font=('Arial', 11),
                                             relief=tk.SUNKEN, 
                                             bg='#1E1E1E', 
                                             fg='white', 
                                             insertbackground='white', 
                                             state=tk.DISABLED 
                                             )
        self.transcription_display.pack(pady=10, padx=20, fill=tk.BOTH, expand=True)
        
        # Initial text insertion for tk.Text
        self.transcription_display.config(state=tk.NORMAL)
        self.transcription_display.insert(tk.END, "Transcribed text will appear here. Select it to copy.")
        self.transcription_display.config(state=tk.DISABLED)


        # Exit Button
        self.exit_button = ttk.Button(master, 
                                      text="Exit", 
                                      command=self.on_closing,
                                      style='Dark.TButton')
        self.exit_button.pack(pady=10)

        # Handle window closing
        master.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        # Start the loop checking the queue
        self.master.after(100, self.check_transcription_queue)
        logging.info("GUI initialized successfully.")

    def save_transcription_metadata(self, audio_path: str, transcription: str):
        """Saves the transcription metadata to a file next to the audio file."""
        import json
        from datetime import datetime

        json_path = audio_path.replace('.wav', '.json')

        metadata = {
            'wav_filename': os.path.basename(audio_path),
            'transcription': transcription,
            'created_at': datetime.now().isoformat(),
            'timestamp': os.path.basename(audio_path).replace('recording-', '').replace('.wav', ''),
        }
        
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        logging.info(f"Transcription metadata saved to {json_path}")

    def load_transcription_history(self):
        """Loads the transcription history from the files in the output directory."""
        import glob
        import json
        from datetime import datetime

        json_files = glob.glob('output/*.json')
        history = []

        for json_file in json_files:
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                    history.append(metadata)
            except Exception as e:
                logging.error(f"Error loading transcription history from {json_file}: {e}")
                continue
        history.sort(key=lambda x: x.get('timestamp', '0'), reverse=True)
        return history
    
    def delete_transcription(self, timestamp: str):
        """Deletes the transcription (wav file and json metadata) with the given timestamp."""
        json_path = f'output/recording-{timestamp}.json'
        wav_path = f'output/recording-{timestamp}.wav'

        deleted = False

        if os.path.exists(json_path):
            os.remove(json_path)
            logging.info(f"Transcription metadata deleted for {timestamp}.")
            deleted = True

        if os.path.exists(wav_path):
            os.remove(wav_path)
            logging.info(f"Transcription file deleted for {timestamp}.")
            deleted = True

        if deleted:
            logging.info(f"Transcription for {timestamp} deleted successfully.")
            messagebox.showinfo("Success", f"Transcription for {timestamp} deleted successfully.")
        else:
            logging.error(f"Transcription for {timestamp} not found.")
            messagebox.showerror("Error", f"Transcription for {timestamp} not found.")

    def copy_to_clipboard(self, text: str):
        """Copies the given text to the system clipboard."""
        self.master.clipboard_clear()
        self.master.clipboard_append(text)
        logging.info("Transcription copied to clipboard.")

    def toggle_recording(self):
        """Toggles the recording state (start/stop)."""
        if self.recording:
            self.stop_recording()
        else:
            self.start_recording()

    def start_recording(self):
        """Starts the audio recording process."""
        self.recording = True
        self.frames = []
        self.start_time = time.time()
        logging.info("Recording started.")
        
        try:
            self.stream = self.p.open(format=FORMAT,
                                     channels=CHANNELS,
                                     rate=RATE,
                                     input=True,
                                     frames_per_buffer=CHUNK)

            # Update button text to show status
            self.record_button.config(text="Stop Recording") 
            
            # Update text display
            self.transcription_display.config(state=tk.NORMAL)
            self.transcription_display.delete('1.0', tk.END)
            self.transcription_display.insert(tk.END, "Recording in progress... (max 30s)")
            self.transcription_display.config(state=tk.DISABLED)
            
            self.read_chunk()
            # Set a timer for automatic stop
            self.record_timer_id = self.master.after(MAX_RECORD_DURATION * 1000, self.auto_stop_recording)

        except Exception as e:
            self.recording = False
            self.record_button.config(text="Record", state=tk.NORMAL) 
            logging.error(f"Microphone stream error on start: {e}")
            messagebox.showerror("Audio Error", f"Could not open microphone stream: {e}\nCheck your microphone connection and permissions.")
            if self.record_timer_id:
                self.master.after_cancel(self.record_timer_id)
                self.record_timer_id = None
            
    def read_chunk(self):
        """Reads one audio chunk and schedules the next call."""
        if self.recording:
            try:
                data = self.stream.read(CHUNK, exception_on_overflow=False)
                self.frames.append(data)
                self.master.after(1, self.read_chunk) 
            except IOError as e:
                logging.error(f"Stream read IOError: {e}")
                self.stop_recording()

    def auto_stop_recording(self):
        """Automatically stops recording after MAX_RECORD_DURATION expires."""
        if self.recording:
            logging.info(f"Automatic stop triggered after {MAX_RECORD_DURATION} seconds.")
            self.stop_recording()
            messagebox.showinfo("Recording Finished", f"The recording was stopped automatically after {MAX_RECORD_DURATION} seconds. Starting transcription...")

    def stop_recording(self):
        """Stops the stream, saves the file, and starts the transcription thread."""
        if not self.recording:
            return

        self.recording = False
        
        if self.record_timer_id:
            self.master.after_cancel(self.record_timer_id)
            self.record_timer_id = None

        # Stop and close the stream
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
            self.stream = None
        logging.info("Audio stream closed.")

        WAVE_OUTPUT_FILENAME = output_filename()
        
        # Update button status for user feedback
        self.record_button.config(text="Saving...", state=tk.DISABLED) 
        self.master.update_idletasks()

        # Save to WAVE file
        try:
            with wave.open(WAVE_OUTPUT_FILENAME, 'wb') as wf:
                wf.setnchannels(CHANNELS)
                wf.setsampwidth(self.p.get_sample_size(FORMAT))
                wf.setframerate(RATE)
                wf.writeframes(b''.join(self.frames))
            logging.info(f"File saved successfully to {WAVE_OUTPUT_FILENAME}")
            
            self.record_button.config(text="Transcribing...")
            
            # Update text in read-only Text widget
            self.transcription_display.config(state=tk.NORMAL)
            self.transcription_display.delete('1.0', tk.END)
            self.transcription_display.insert(tk.END, "Transcription in progress (this may take a while)...")
            self.transcription_display.config(state=tk.DISABLED)
            
            # === START TRANSCRIPTION IN A THREAD ===
            transcription_thread = threading.Thread(
                target=self.run_transcription,
                args=(WAVE_OUTPUT_FILENAME,),
                daemon=True
            )
            transcription_thread.start()
            logging.info("Transcription thread started.")

        except Exception as e:
            messagebox.showerror("Save Error", f"Failed to save WAVE file: {e}")
            self.record_button.config(text="Record", state=tk.NORMAL) 
            logging.error(f"Error saving wave file: {e}", exc_info=True)

    def run_transcription(self, audio_path):
        """
        Method executed in a separate thread. 
        Calls transcription and puts the result in the queue.
        """
        logging.info(f"Running transcription for {audio_path} in thread: {threading.get_ident()}")
        transcription = transcribe_audio(audio_path, MODEL_NAME)
        self.transcription_queue.put((audio_path, transcription))

    def check_transcription_queue(self):
        """
        Checks the queue for transcription results.
        Run in the main GUI thread.
        """
        try:
            audio_path, result = self.transcription_queue.get(block=False)

            if "ERROR" not in result:
                self.save_transcription_metadata(audio_path, result)
            
            # 1. Update Transcriber tab (main output)
            self.transcription_display.config(state=tk.NORMAL)
            self.transcription_display.delete('1.0', tk.END)
            self.transcription_display.insert(tk.END, result)
            self.transcription_display.config(state=tk.DISABLED)
            
            # 2. Update History tab (last output)
            self.history_display.config(state=tk.NORMAL)
            self.history_display.delete('1.0', tk.END)
            self.history_display.insert(tk.END, "Under construction..." + result)
            self.history_display.config(state=tk.DISABLED)
            
            if "ERROR" in result:
                logging.warning("Transcription failed with error message.")
                messagebox.showerror("Transcription Failed", "Transcription returned an error. Check logs for details.")
            else:
                # Copy to clipboard upon successful transcription
                self.copy_to_clipboard(result) 
                
            self.record_button.config(text="Record", state=tk.NORMAL) # Return to normal state

        except queue.Empty:
            pass
        finally:
            self.master.after(100, self.check_transcription_queue)

    def on_closing(self):
        """Handles clean application shutdown."""
        logging.info("Closing application...")
        if self.recording:
            self.stop_recording() 
        
        # Terminate PyAudio
        if self.p:
            self.p.terminate()
        
        self.master.destroy()
        logging.info("Application destroyed.")

# --- Application Startup ---
if __name__ == "__main__":
    logging.info("Whisper model loading might take a moment on first launch...")
    root = tk.Tk()
    app = AudioRecorderApp(root)
    root.mainloop()
