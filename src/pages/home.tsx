import FileUploader from "@/components/fileuploader";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export type MediaFile = {
    file: File;
    objectUrl: string;
    kind: "audio" | "video";
}

export type FileInfoResponse = {
    transcript: string;
    summary: string;
}

const Home = () => {
    const [fileInfoResponse, setFileInfoResponse] = useState<FileInfoResponse | null>();
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [isDragRejected, setIsDragRejected] = useState(false);
    const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

    const handleDragRejected = (rejected: boolean) => {
        setIsDragRejected(rejected);
    };

    const handleGenerateQuestion = async () => {
        try {
            const response = await fetch('http://localhost:8000/stt/transcription/answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',  // Required header
                },
                body: JSON.stringify({ question }),  // Direct JSON serialization
                credentials: 'include'
            })
            
            const result = await response.json();
            setAnswer(result.answer);
        } catch (error) {
            console.log(error)
        }
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* File Upload Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <FileUploader onDragRejected={handleDragRejected} selectedFile={selectedFile} onChange={setSelectedFile} setFileInfoResponse={setFileInfoResponse} />
                </div>

                {/* Transcription Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Transcription</h2>
                    </div>

                    {/* Transcription Field */}
                    <div className="relative">
                        <textarea
                            value={fileInfoResponse?.transcript}
                            readOnly
                            placeholder="Transcription will appear here after processing..."
                            className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-700"
                        />
                        {fileInfoResponse?.transcript && (
                            <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                Ready
                            </div>
                        )}
                    </div>
                </div>
                {/* Summary Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">Summary</h2>
                    </div>

                    {/* Summary Field */}
                    <div className="relative githubMarkdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{fileInfoResponse?.summary}</ReactMarkdown>
                        {fileInfoResponse?.summary && (
                            <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                Ready
                            </div>
                        )}
                    </div>
                </div>

                {/* Type Selection and Questions Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    {/* Custom Question Input */}
                    <div className="mt-4 mx-32">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Add custom question..."
                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleGenerateQuestion}
                                type="submit"
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Generate Answer
                            </button>
                        </div>
                    </div>
                </div>

                {/* Answer Field */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Answer</h3>
                    <textarea
                        value={answer}
                        disabled
                        placeholder="Your answer will appear here based on the selected questions and transcription..."
                        className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default Home;