import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Upload, Video, Mic, User, Sparkles, Check, AlertCircle, Play, Pause, RotateCcw, FileVideo, FileAudio, Zap, Shield, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FileUpload {
  file: File | null;
  preview?: string;
  duration?: number;
  isValid: boolean;
  error?: string;
}

interface FormData {
  video: FileUpload;
  audio: FileUpload;
  name: string;
  description: string;
}

const CreatePage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [extractedFrameUrl, setExtractedFrameUrl] = useState<string | null>(null);
  const [isExtractingFrame, setIsExtractingFrame] = useState<boolean>(false);
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState<boolean>(false);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [speechText, setSpeechText] = useState<string>('Hello, this is a test of my new voice!');
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState<boolean>(false);
  const [generatedSpeechUrl, setGeneratedSpeechUrl] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animatedVideoUrl, setAnimatedVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    video: { file: null, isValid: false },
    audio: { file: null, isValid: false },
    name: '',
    description: ''
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { 
      id: 1, 
      title: 'Upload Video', 
      icon: Video, 
      description: 'Record or upload a 30-second video',
      subtitle: 'Well-lit, front-facing video with neutral background'
    },
    { 
      id: 2, 
      title: 'Upload Audio', 
      icon: Mic, 
      description: 'Provide a clear voice sample',
      subtitle: '30-second clip of you speaking clearly'
    },
    { 
      id: 3, 
      title: 'Name Your Twin', 
      icon: User, 
      description: 'Give your digital twin a name',
      subtitle: 'Add a name and optional description'
    },
    { 
      id: 4, 
      title: 'Generate Clone', 
      icon: Sparkles, 
      description: 'Create your AI avatar',
      subtitle: 'AI processing and model generation'
    }
  ];

  const validateVideo = useCallback((file: File): Promise<{ isValid: boolean; error?: string; duration?: number }> => {
    return new Promise((resolve) => {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        resolve({ isValid: false, error: 'Video file too large (max 100MB)' });
        return;
      }

      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        if (duration < 10) {
          resolve({ isValid: false, error: 'Video must be at least 10 seconds long' });
        } else if (duration > 120) {
          resolve({ isValid: false, error: 'Video must be less than 2 minutes long' });
        } else {
          resolve({ isValid: true, duration });
        }
      };

      video.onerror = () => {
        resolve({ isValid: false, error: 'Invalid video format. Please use MP4, MOV, or WebM' });
      };

      video.src = URL.createObjectURL(file);
    });
  }, []);

  const validateAudio = useCallback((file: File): Promise<{ isValid: boolean; error?: string; duration?: number }> => {
    return new Promise((resolve) => {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        resolve({ isValid: false, error: 'Audio file too large (max 50MB)' });
        return;
      }

      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        if (duration < 10) {
          resolve({ isValid: false, error: 'Audio must be at least 10 seconds long' });
        } else if (duration > 300) {
          resolve({ isValid: false, error: 'Audio must be less than 5 minutes long' });
        } else {
          resolve({ isValid: true, duration });
        }
      };

      audio.onerror = () => {
        resolve({ isValid: false, error: 'Invalid audio format. Please use MP3, WAV, or M4A' });
      };

      audio.src = URL.createObjectURL(file);
    });
  }, []);

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = await validateVideo(file);
    const preview = URL.createObjectURL(file);

    setFormData(prev => ({
      ...prev,
      video: {
        file,
        preview,
        duration: validation.duration,
        isValid: validation.isValid,
        error: validation.error
      }
    }));

    if (validation.isValid && file) {
      setIsExtractingFrame(true);
      setExtractedFrameUrl(null);
      const apiFormData = new FormData();
      apiFormData.append('file', file);

      try {
        const response = await fetch('http://localhost:8000/video/extract-frame', {
          method: 'POST',
          body: apiFormData,
        });

        if (response.ok) {
          const data = await response.json();
          setExtractedFrameUrl(data.frame_url);
          handleGenerateAvatar(data.frame_url);
        } else {
          console.error('Failed to extract frame');
          // Optionally, set an error state to show in the UI
        }
      } catch (error) {
        console.error('Error extracting frame:', error);
        // Optionally, set an error state to show in the UI
      } finally {
        setIsExtractingFrame(false);
      }
    }
  };

  const handleGenerateAvatar = async (imageUrl: string) => {
    setIsGeneratingAvatar(true);
    setGeneratedAvatarUrl(null);
    try {
      const response = await fetch(`http://localhost:8000/video/generate-avatar?image_url=${encodeURIComponent(imageUrl)}`, {
        method: 'POST',
      });

      if (response.ok) {
        const imageBlob = await response.blob();
        const avatarUrl = URL.createObjectURL(imageBlob);
        setGeneratedAvatarUrl(avatarUrl);
      } else {
        console.error('Failed to generate avatar');
      }
    } catch (error) {
      console.error('Error generating avatar:', error);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = await validateAudio(file);
    const preview = URL.createObjectURL(file);

    setFormData(prev => ({
      ...prev,
      audio: {
        file,
        preview,
        duration: validation.duration,
        isValid: validation.isValid,
        error: validation.error
      }
    }));

    if (validation.isValid && file) {
      handleCloneVoice(file);
    }
  };

  const handleCloneVoice = async (audioFile: File) => {
    setIsCloning(true);
    setVoiceId(null);
    const apiFormData = new FormData();
    apiFormData.append('file', audioFile);

    try {
      const response = await fetch('http://localhost:8000/voice/clone-voice', {
        method: 'POST',
        body: apiFormData,
      });

      if (response.ok) {
        const data = await response.json();
        setVoiceId(data.voice_id);
      } else {
        console.error('Failed to clone voice');
      }
    } catch (error) {
      console.error('Error cloning voice:', error);
    } finally {
      setIsCloning(false);
    }
  };

  const handleGenerateSpeech = async () => {
    if (!voiceId || !speechText) return;
    setIsGeneratingSpeech(true);
    setGeneratedSpeechUrl(null);
    try {
      const response = await fetch('http://localhost:8000/voice/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speechText, voice_id: voiceId }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        setGeneratedSpeechUrl(audioUrl);
      } else {
        console.error('Failed to generate speech');
      }
    } catch (error) {
      console.error('Error generating speech:', error);
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  const handleAnimate = async () => {
    if (!generatedAvatarUrl || !generatedSpeechUrl) return;
    setIsAnimating(true);
    setAnimatedVideoUrl(null);

    try {
      // Fetch blobs from the local URLs
      const avatarResponse = await fetch(generatedAvatarUrl);
      const avatarBlob = await avatarResponse.blob();

      const speechResponse = await fetch(generatedSpeechUrl);
      const speechBlob = await speechResponse.blob();

      // D-ID requires public URLs, so we need a way to get them.
      // Let's assume a new backend endpoint `/animation/upload` that handles this.
      const uploadFormData = new FormData();
      uploadFormData.append('avatar', avatarBlob, 'avatar.jpg');
      uploadFormData.append('audio', speechBlob, 'speech.mp3');
      
      const uploadResponse = await fetch('http://localhost:8000/animation/upload-for-animation', {
          method: 'POST',
          body: uploadFormData,
      });

      if (!uploadResponse.ok) {
          throw new Error('Failed to upload assets for animation.');
      }
      
      const { avatar_url, audio_url } = await uploadResponse.json();

      const animateResponse = await fetch('http://localhost:8000/animation/animate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url, audio_url }),
      });

      if (!animateResponse.ok) throw new Error('Failed to start animation');
      const { talk_id } = await animateResponse.json();

      // Poll for the result
      const poll = async () => {
        const statusResponse = await fetch(`http://localhost:8000/animation/talks/${talk_id}`);
        if (!statusResponse.ok) throw new Error('Polling failed');
        
        const data = await statusResponse.json();
        if (data.status === 'done') {
          setAnimatedVideoUrl(data.result_url);
          setIsAnimating(false);
        } else if (data.status === 'error') {
            throw new Error('Animation failed on the server.');
        } else {
          setTimeout(poll, 3000); // Poll every 3 seconds
        }
      };
      poll();

    } catch (error) {
      console.error('Error animating avatar:', error);
      setIsAnimating(false);
    }
  };

  const handleSaveToCloud = async () => {
    if (!animatedVideoUrl) return;
    setIsUploading(true);
    setCloudinaryUrl(null);

    try {
      const response = await fetch('http://localhost:8000/storage/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: animatedVideoUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload video to Cloudinary.');
      }

      const data = await response.json();
      setCloudinaryUrl(data.url);
    } catch (error) {
      console.error('Error saving to Cloudinary:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    const stages = [
      'Analyzing video content...',
      'Processing facial features...',
      'Training voice model...',
      'Generating avatar...',
      'Finalizing digital twin...'
    ];

    for (let i = 0; i < stages.length; i++) {
      setGenerationStage(stages[i]);
      
      // Simulate processing time with more realistic progress
      const stageProgress = 100 / stages.length;
      for (let progress = 0; progress <= 100; progress += Math.random() * 5 + 1) {
        setGenerationProgress(Math.min(100, (i * stageProgress) + (progress * stageProgress / 100)));
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      }
    }

    setIsComplete(true);
    setIsGenerating(false);
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.video.isValid;
      case 2:
        return formData.audio.isValid;
      case 3:
        return formData.name.trim().length > 0;
      default:
        return false;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [avatar, setAvatar] = useState<File | null>(null);
  const [script, setScript] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVideoUrl(null);
    setJobId(null);
    if (!avatar) {
      setError('Please upload an avatar image.');
      return;
    }
    if (!script.trim()) {
      setError('Please enter a script.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatar);
      formData.append('script', script);
      formData.append('dry_run', String(dryRun));
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to generate video.');
      }
      const data = await response.json();
      setVideoUrl(data.video_url);
      setJobId(data.job_id);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            {/* Success Animation */}
            <div className="relative inline-flex items-center justify-center w-32 h-32 mb-8">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75" />
              <div className="relative bg-green-500 rounded-full p-8 shadow-2xl">
                <Check className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎉 Your Digital Twin is Ready!
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              <span className="font-semibold text-green-600">{formData.name}</span> has been successfully created
            </p>
            <p className="text-gray-500 mb-8">
              Your AI avatar and voice clone are now ready to use
            </p>
            
            {/* Success Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <Video className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-900">Video Avatar</div>
                <div className="text-xs text-gray-500">Ready</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <Mic className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-900">Voice Clone</div>
                <div className="text-xs text-gray-500">Ready</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <Sparkles className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-900">AI Model</div>
                <div className="text-xs text-gray-500">Trained</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
              >
                <Zap className="h-5 w-5 mr-2" />
                View in Dashboard
              </Link>
              <button
                onClick={() => {
                  setIsComplete(false);
                  setCurrentStep(1);
                  setFormData({
                    video: { file: null, isValid: false },
                    audio: { file: null, isValid: false },
                    name: '',
                    description: ''
                  });
                }}
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 font-medium rounded-xl hover:bg-gray-50 border border-gray-300 transition-all transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
              >
                <User className="h-5 w-5 mr-2" />
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Create Your Digital Twin</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform yourself into an AI avatar in just a few simple steps. 
              Upload your video and audio, and let our AI create your digital twin.
            </p>
          </div>
        </div>

        {/* Enhanced Progress Steps */}
        <div className="mb-16">
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-teal-500 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
            
            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    currentStep > step.id
                      ? 'bg-green-500 border-green-500 text-white shadow-lg'
                      : currentStep === step.id
                      ? 'bg-blue-500 border-blue-500 text-white shadow-lg animate-pulse'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {currentStep > step.id ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <step.icon className="h-6 w-6" />
                    )}
                    
                    {/* Glow effect for current step */}
                    {currentStep === step.id && (
                      <div className="absolute inset-0 bg-blue-500 rounded-full opacity-30 animate-ping" />
                    )}
                  </div>
                  
                  <div className="mt-4 text-center max-w-32">
                    <div className={`text-sm font-semibold transition-colors ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 leading-tight">
                      {step.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* Step 1: Video Upload */}
          {currentStep === 1 && (
            <div className="p-8 lg:p-12">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl mb-6">
                  <Video className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Step 1: Upload Your Video</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Upload a clear, front-facing video of yourself speaking. Best results with good lighting and neutral background.
                </p>
              </div>

              <div className="max-w-3xl mx-auto">
                {!formData.video.file ? (
                  <div className="space-y-6">
                    {/* Upload Area */}
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="relative border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-teal-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6 group-hover:bg-blue-200 transition-colors">
                          <Upload className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Click to upload video</h3>
                        <p className="text-gray-600 mb-4">or drag and drop your file here</p>
                        
                        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <FileVideo className="h-4 w-4" />
                            <span>MP4, MOV, WebM</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4" />
                            <span>Max 100MB</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>10-120 seconds</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tips */}
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                      <h4 className="font-semibold text-blue-900 mb-3">💡 Tips for best results:</h4>
                      <ul className="space-y-2 text-blue-800 text-sm">
                        <li>• Use good lighting (natural light works best)</li>
                        <li>• Keep a neutral, solid-colored background</li>
                        <li>• Look directly at the camera</li>
                        <li>• Speak clearly and naturally</li>
                        <li>• Avoid excessive movement or gestures</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Previews */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      {/* Video Preview */}
                      <div className="relative bg-black rounded-2xl overflow-hidden shadow-xl">
                        <video
                          ref={videoRef}
                          src={formData.video.preview}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Generated Avatar Preview */}
                      <div className="relative bg-gray-100 rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
                        <div className="text-center p-4">
                           <h4 className="font-semibold text-gray-800 mb-2">Generated Avatar</h4>
                          {isGeneratingAvatar && (
                            <div className="space-y-2">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                              <p className="text-sm text-gray-600">Generating your avatar...</p>
                            </div>
                          )}
                          {!isGeneratingAvatar && generatedAvatarUrl && (
                            <img src={generatedAvatarUrl} alt="Generated Avatar" className="w-full h-full object-cover rounded-lg shadow-md" />
                          )}
                           {!isGeneratingAvatar && !generatedAvatarUrl && (
                             <div className="text-gray-500">
                               <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                               <p className="text-sm">Your generated avatar will appear here</p>
                             </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* File Info */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${formData.video.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
                            {formData.video.isValid ? (
                              <Check className="h-6 w-6 text-green-600" />
                            ) : (
                              <AlertCircle className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{formData.video.file.name}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              {formData.video.duration && (
                                <span>{formatDuration(formData.video.duration)}</span>
                              )}
                              <span>{(formData.video.file.size / (1024 * 1024)).toFixed(1)}MB</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                formData.video.isValid 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {formData.video.isValid ? 'Valid' : 'Invalid'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setFormData(prev => ({ ...prev, video: { file: null, isValid: false } }));
                            if (videoInputRef.current) videoInputRef.current.value = '';
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Remove video"
                        >
                          <RotateCcw className="h-5 w-5" />
                        </button>
                      </div>

                      {formData.video.error && (
                        <div className="mt-4 flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Upload Error</p>
                            <p className="text-sm text-red-700 mt-1">{formData.video.error}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Step 2: Audio Upload */}
          {currentStep === 2 && (
            <div className="p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                {/* Left side: Upload and Status */}
                <div className="space-y-8">
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl mb-6">
                      <Mic className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Step 2: Clone Your Voice</h2>
                    <p className="text-lg text-gray-600">
                      Upload a clear, 30-second audio sample of your voice. This will be used to create a digital clone for generating speech.
                    </p>
                  </div>

                  {!formData.audio.file ? (
                     <div
                      onClick={() => audioInputRef.current?.click()}
                      className="relative border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer group"
                    >
                      <div className="relative">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-6 group-hover:bg-green-200 transition-colors">
                          <Upload className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Voice Sample</h3>
                        <p className="text-gray-600 text-sm">MP3, WAV, M4A | Max 50MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                           <div className={`p-3 rounded-xl ${formData.audio.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
                            {formData.audio.isValid ? <Check className="h-6 w-6 text-green-600" /> : <AlertCircle className="h-6 w-6 text-red-600" />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 truncate max-w-xs">{formData.audio.file.name}</p>
                          </div>
                        </div>
                        <button onClick={() => setFormData(prev => ({ ...prev, audio: { file: null, isValid: false } }))} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg">
                          <RotateCcw className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cloning Status */}
                  {isCloning && (
                    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                       <p className="text-sm text-blue-800">Cloning your voice with Fish Audio...</p>
                    </div>
                  )}
                  {voiceId && !isCloning && (
                     <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                       <Check className="h-5 w-5 text-green-600" />
                       <p className="text-sm text-green-800">Voice cloned successfully! You can now generate speech.</p>
                    </div>
                  )}

                </div>

                {/* Right side: Speech Generation */}
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Generate Speech</h3>
                  <textarea
                    value={speechText}
                    onChange={(e) => setSpeechText(e.target.value)}
                    placeholder="Enter text to generate speech..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                    disabled={!voiceId || isGeneratingSpeech}
                  />
                  <button
                    onClick={handleGenerateSpeech}
                    disabled={!voiceId || isGeneratingSpeech || isCloning}
                    className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all transform hover:-translate-y-0.5"
                  >
                    {isGeneratingSpeech ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Generate Speech
                      </>
                    )}
                  </button>

                  {/* Audio Player */}
                  {generatedSpeechUrl && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">Generated Speech</h3>
                      <audio controls src={generatedSpeechUrl} className="w-full"></audio>
                      <button
                        onClick={handleAnimate}
                        className="btn btn-primary mt-4 w-full"
                        disabled={isAnimating}
                      >
                        {isAnimating ? 'Animating...' : 'Animate Avatar'}
                      </button>
                    </div>
                  )}
                  {isAnimating && <p>Animating avatar... please wait.</p>}
                  {animatedVideoUrl && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold mb-2">Animated Video</h3>
                      <video controls src={animatedVideoUrl} className="w-full rounded-lg"></video>
                      <button
                        onClick={handleSaveToCloud}
                        className="btn btn-secondary mt-4 w-full"
                        disabled={isUploading}
                      >
                        {isUploading ? 'Saving to Cloud...' : 'Save to Cloud'}
                      </button>
                      {cloudinaryUrl && (
                        <div className="mt-2 text-sm text-green-600">
                          Saved!{' '}
                          <a href={cloudinaryUrl} target="_blank" rel="noopener noreferrer" className="underline">
                            View here
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Name and Description */}
          {currentStep === 3 && (
            <div className="p-8 lg:p-12">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl mb-6">
                  <User className="h-10 w-10 text-purple-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Step 3: Name Your Digital Twin</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Give your AI avatar a memorable name and add an optional description to help you identify it later.
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-8">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Alex Professional, Sarah Educator, Marcus Gaming"
                    className="w-full px-6 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <p className="text-sm text-gray-500 mt-2">Choose a name that reflects your digital twin's purpose</p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-3">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your digital twin's purpose, style, or characteristics..."
                    rows={4}
                    className="w-full px-6 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none shadow-sm"
                  />
                  <p className="text-sm text-gray-500 mt-2">Help others understand what makes your digital twin unique</p>
                </div>

                {/* Preview Card */}
                {formData.name && (
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
                    <h4 className="font-semibold text-purple-900 mb-3">Preview</h4>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900">{formData.name}</h5>
                          {formData.description && (
                            <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Generate */}
          {currentStep === 4 && (
            <div className="p-8 lg:p-12">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-200 rounded-2xl mb-6">
                  <Sparkles className="h-10 w-10 text-orange-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Step 4: Generate Your Clone</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Review your inputs and let our AI create your digital twin. This process typically takes 2-5 minutes.
                </p>
              </div>

              <div className="max-w-3xl mx-auto">
                {!isGenerating ? (
                  <div className="space-y-8">
                    {/* Summary */}
                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Summary</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <Video className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Video Upload</p>
                            <p className="text-sm text-gray-600">
                              {formData.video.duration && formatDuration(formData.video.duration)} • {formData.video.file && (formData.video.file.size / (1024 * 1024)).toFixed(1)}MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-green-100 rounded-xl">
                            <Mic className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Audio Upload</p>
                            <p className="text-sm text-gray-600">
                              {formData.audio.duration && formatDuration(formData.audio.duration)} • {formData.audio.file && (formData.audio.file.size / (1024 * 1024)).toFixed(1)}MB
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-purple-100 rounded-xl">
                            <User className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{formData.name}</p>
                            {formData.description && (
                              <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerate}
                      className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold py-6 rounded-2xl hover:from-orange-600 hover:to-pink-600 transition-all transform hover:-translate-y-1 shadow-xl hover:shadow-2xl text-lg"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <Sparkles className="h-6 w-6" />
                        <span>Generate My Digital Twin</span>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-8">
                    {/* Generation Animation */}
                    <div className="relative">
                      <div className="w-40 h-40 mx-auto bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center relative overflow-hidden">
                        <Sparkles className="h-16 w-16 text-orange-600 animate-pulse z-10" />
                        
                        {/* Animated rings */}
                        <div className="absolute inset-0 rounded-full border-4 border-orange-300 animate-spin" style={{ 
                          animationDuration: '3s',
                          borderTopColor: 'transparent',
                          borderRightColor: 'transparent'
                        }} />
                        <div className="absolute inset-4 rounded-full border-4 border-pink-300 animate-spin" style={{ 
                          animationDuration: '2s',
                          animationDirection: 'reverse',
                          borderBottomColor: 'transparent',
                          borderLeftColor: 'transparent'
                        }} />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">Creating Your Digital Twin</h3>
                      <p className="text-lg font-medium text-orange-600 mb-2">{generationStage}</p>
                      
                      {/* Enhanced Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-pink-500 h-4 rounded-full transition-all duration-300 relative overflow-hidden"
                          style={{ width: `${generationProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-white opacity-30 animate-pulse" />
                        </div>
                      </div>
                      
                      <p className="text-lg font-semibold text-gray-700">{Math.round(generationProgress)}% complete</p>
                      <p className="text-sm text-gray-500 mt-2">This may take a few minutes. Please don't close this page.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          {!isGenerating && (
            <div className="border-t border-gray-200 px-8 lg:px-12 py-8">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  className="inline-flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>
                
                <div className="text-sm text-gray-500">
                  Step {currentStep} of {steps.length}
                </div>
                
                {currentStep < 4 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceedToNext()}
                    className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                  >
                    Next Step
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePage;