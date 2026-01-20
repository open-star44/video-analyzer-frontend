import {useDropzone} from "react-dropzone";
import {useCallback, useMemo, useRef, useState} from "react";
import { FileInfoResponse, MediaFile } from "@/pages/home";

type DropzoneProps = {
    onDragRejected?: (isRejected: boolean) => void;
    selectedFile: MediaFile | null;
    onChange: (file: MediaFile | null) => void;
    setFileInfoResponse: (fileInfo: FileInfoResponse | null) => void;
};

const FileUploader = ({ onDragRejected, selectedFile, onChange, setFileInfoResponse }: DropzoneProps) => {
    const [progress, setProgress] = useState<number>(0)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const intervalRef = useRef<number | null>(null)
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcriptionProgress, setTranscriptionProgress] = useState(0);
    const [showTranscriptionProgress, setShowTranscriptionProgress] = useState(true);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles?.[0]
        if (!file) return

        // Reset previous state
        if (selectedFile?.objectUrl) URL.revokeObjectURL(selectedFile.objectUrl)
        onChange(null)
        setProgress(0)
        setIsLoading(true)

        // Determine kind
        const kind: MediaFile["kind"] = file.type.startsWith("audio/") ? "audio" : "video"

        // Try to read to get real progress; fallback to simulated progress
        const reader = new FileReader()

        reader.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.min(99, Math.round((e.loaded / e.total) * 100))
                setProgress(percent)
            }
        }

        reader.onloadend = () => {
            setProgress(100)
            const objectUrl = URL.createObjectURL(file)
            onChange({ file, objectUrl, kind })
            setIsLoading(false)
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }

        // Some browsers do not emit onprogress reliably for local files. Simulate.
        if (!intervalRef.current) {
            intervalRef.current = window.setInterval(() => {
                setProgress((p) => (p < 95 ? p + 1 : p))
            }, 40)
        }

        // Read as array buffer to get progress events
        reader.readAsArrayBuffer(file)
    }, [selectedFile, onChange])

    const handleRemoveFile = () => {
        if (selectedFile?.objectUrl) URL.revokeObjectURL(selectedFile.objectUrl)
        setProgress(0)
        setIsLoading(false)
        
        // Clear any active intervals
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        onChange(null)
    };

    const {getRootProps, getInputProps, isDragActive, isFocused, isDragAccept, isDragReject, open} = useDropzone({
        onDrop,
        accept: {
            "video/*": [],
            "audio/*": [],
        },
        multiple: false,
        noClick: true,
        noKeyboard: true,
    })

    const borderColor = useMemo(() => {
        if (isDragReject) {
            onDragRejected?.(!selectedFile);
            return "border-red-400"
        }
        if (isDragAccept) {
            onDragRejected?.(false);
            return "border-emerald-500"
        }
        onDragRejected?.(false);
        if (isFocused || isDragActive) return "border-blue-400"
        return "border-muted-foreground/30"
    }, [isFocused, isDragActive, isDragAccept, isDragReject, selectedFile])

    const handleGenerateTranscription = async () => {
        if (!selectedFile)
            return

        setIsTranscribing(true)
        setTranscriptionProgress(0)

        try {
            const formData = new FormData();
            formData.append('file', selectedFile.file);
            formData.append('type', selectedFile.kind);

            const response = await fetch('http://localhost:8000/stt/transcription', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })
            
            if (!response.ok) throw new Error('Upload failed');
            
            const result = await response.json();
            setFileInfoResponse(result) as FileInfoResponse | unknown
        } catch (error) {

        } finally {
            setIsTranscribing(false);
            setTranscriptionProgress(100);
        }
    };

    return (
        <div className="rounded-2xl max-w-2xl mx-auto ">
            <div
                {...getRootProps()}
                className={`rounded-2xl border-2 ${borderColor} bg-[#f1fff7] border-dashed p-8 transition-colors text-center cursor-pointer select-none`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-2xl">🎵</span>
                    </div>
                    <div className="text-lg font-semibold">Drag & drop audio or video</div>
                    <div className="text-sm text-muted-foreground">or</div>
                    <button
                        type="button"
                        onClick={open}
                        className="inline-flex items-center rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-50 border-emerald-800 border-2 border-l-8"
                    >
                        Choose file
                    </button>
                    <div className="text-xs text-muted-foreground mt-2">Supported: mp3, wav, m4a, mp4, webm, mov</div>
                </div>
            </div>

            {(isLoading || progress > 0) && (
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-1">
                    <div className="text-sm">
                        <span className="text-muted-foreground">Loading</span>
                        <span className="font-medium ml-2">{progress}%</span>
                    </div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-[width]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {selectedFile && !isLoading && (
                <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            Selected: {selectedFile.file.name}
                        </div>
                        <button
                            onClick={handleRemoveFile}
                            className="text-red-600 hover:text-red-800 text-sm"
                        >
                            Remove
                        </button>
                    </div>
                    <div className="rounded-lg overflow-hidden bg-black/5">
                        {selectedFile.kind === "video" ? (
                            <video src={selectedFile.objectUrl} className="w-full max-h-[360px]" controls />
                        ) : (
                            <audio src={selectedFile.objectUrl} className="w-full" controls />
                        )}
                    </div>
                </div>
            )}
            
            {/* Transcription Button */}
            <button
                onClick={handleGenerateTranscription}
                disabled={isTranscribing || isDragReject || !selectedFile}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mx-auto block mt-2.5"
            >
                {isTranscribing ? "Transcribing..." : "Generate Transcription"}
            </button>
            
            {/* Transcription Progress Bar */}
            {isTranscribing && (
                <div className="mb-4">
                    <div className="flex justify-between items-center">
                    <div className="text-sm">
                        <span className="text-gray-600">Transcribing...</span>
                        <span className="font-medium ml-2">{transcriptionProgress}%</span>
                    </div>
                    </div>
                    {showTranscriptionProgress && (
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${transcriptionProgress}%` }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default FileUploader