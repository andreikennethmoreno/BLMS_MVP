import React, { useState, useRef } from 'react';
import { Upload, PenTool, X, Save, Trash2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignatureSave: (signatureDataUrl: string) => void;
  title?: string;
}

const SignatureUploadModal: React.FC<SignatureUploadModalProps> = ({
  isOpen,
  onClose,
  onSignatureSave,
  title = "Create Your Signature"
}) => {
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'upload'>('draw');
  const [uploadedSignature, setUploadedSignature] = useState<string>('');
  const signatureCanvasRef = useRef<SignatureCanvas>(null);

  const handleSignatureSave = () => {
    let signatureDataUrl = '';

    if (signatureMethod === 'draw' && signatureCanvasRef.current) {
      if (signatureCanvasRef.current.isEmpty()) {
        alert('Please draw your signature before saving');
        return;
      }
      signatureDataUrl = signatureCanvasRef.current.toDataURL();
    } else if (signatureMethod === 'upload' && uploadedSignature) {
      signatureDataUrl = uploadedSignature;
    } else {
      alert('Please create a signature before saving');
      return;
    }

    onSignatureSave(signatureDataUrl);
    handleClose();
  };

  const handleSignatureClear = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedSignature(result);
    };
    reader.readAsDataURL(file);
  };

  const handleClose = () => {
    setSignatureMethod('draw');
    setUploadedSignature('');
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Signature Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose signature method:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSignatureMethod('draw')}
                className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-colors ${
                  signatureMethod === 'draw'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <PenTool className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Draw Signature</div>
                  <div className="text-sm text-gray-600">Use mouse or touch to draw</div>
                </div>
              </button>

              <button
                onClick={() => setSignatureMethod('upload')}
                className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-colors ${
                  signatureMethod === 'upload'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Upload Image</div>
                  <div className="text-sm text-gray-600">Upload signature image</div>
                </div>
              </button>
            </div>
          </div>

          {/* Signature Creation Area */}
          <div className="space-y-6">
            {signatureMethod === 'draw' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Draw your signature:
                </label>
                <div className="border-2 border-gray-300 rounded-lg bg-white">
                  <SignatureCanvas
                    ref={signatureCanvasRef}
                    canvasProps={{
                      width: 500,
                      height: 200,
                      className: 'signature-canvas w-full h-full rounded-lg'
                    }}
                    backgroundColor="rgb(255, 255, 255)"
                    penColor="rgb(0, 0, 0)"
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    Use your mouse or touch to draw your signature
                  </p>
                  <button
                    onClick={handleSignatureClear}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload signature image:
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {uploadedSignature ? (
                    <div className="space-y-4">
                      <img
                        src={uploadedSignature}
                        alt="Uploaded signature"
                        className="max-w-full max-h-32 mx-auto"
                      />
                      <button
                        onClick={() => setUploadedSignature('')}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm mx-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <label className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-700 font-medium">
                          Click to upload
                        </span>
                        <span className="text-gray-600"> or drag and drop</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignatureSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Signature</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureUploadModal;