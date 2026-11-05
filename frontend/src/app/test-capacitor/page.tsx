'use client';

import { useState, useEffect } from 'react';
import { isNative, getDeviceInfo, hapticLight, hapticMedium, hapticHeavy, takePhoto, pickImageFromGallery, shareContent } from '@/utils/capacitor-utils';

export default function CapacitorTestPage() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [nativeStatus, setNativeStatus] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    const checkStatus = async () => {
      const native = isNative();
      setNativeStatus(native);
      
      if (native) {
        const info = await getDeviceInfo();
        setDeviceInfo(info);
      }
    };
    
    checkStatus();
  }, []);

  const handleHapticTest = async (type: 'light' | 'medium' | 'heavy') => {
    try {
      if (type === 'light') await hapticLight();
      if (type === 'medium') await hapticMedium();
      if (type === 'heavy') await hapticHeavy();
      setTestResult(`✅ Haptic ${type} feedback triggered!`);
    } catch (error) {
      setTestResult(`❌ Haptic ${type} failed: ${error}`);
    }
  };

  const handleCameraTest = async () => {
    try {
      const photo = await takePhoto();
      setTestResult(photo ? `✅ Photo taken: ${photo}` : '❌ Camera cancelled');
    } catch (error) {
      setTestResult(`❌ Camera error: ${error}`);
    }
  };

  const handleGalleryTest = async () => {
    try {
      const image = await pickImageFromGallery();
      setTestResult(image ? `✅ Image picked: ${image}` : '❌ Gallery cancelled');
    } catch (error) {
      setTestResult(`❌ Gallery error: ${error}`);
    }
  };

  const handleShareTest = async () => {
    try {
      await shareContent({
        title: 'MuzikaX Test',
        text: 'Testing native share functionality!',
        url: 'https://www.muzikax.com/'
      });
      setTestResult('✅ Share dialog opened successfully!');
    } catch (error) {
      setTestResult(`❌ Share failed: ${error}`);
    }
  };

  return (
    <div className="min-h-screen text-white p-6 bg-background">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-pink-500 text-text-primary">
          🔧 Capacitor Native Features Test
        </h1>

        {/* Status Card */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">📊 Environment Status</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Native Environment:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                nativeStatus 
                  ? 'bg-green-600 text-white' 
                  : 'bg-yellow-600 text-white'
              }`}>
                {nativeStatus ? '✅ Yes' : '⚠️ Web Browser'}
              </span>
            </div>

            {deviceInfo && (
              <>
                <div className="flex justify-between">
                  <span>Platform:</span>
                  <span>{deviceInfo.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span>{deviceInfo.model}</span>
                </div>
                <div className="flex justify-between">
                  <span>OS Version:</span>
                  <span>{deviceInfo.osVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span>Manufacturer:</span>
                  <span>{deviceInfo.manufacturer}</span>
                </div>
              </>
            )}

            {!nativeStatus && (
              <p className="text-yellow-400 text-sm mt-4">
                💡 Tip: Native features only work when running in the Capacitor app.
                Build and run on a real device or emulator to test.
              </p>
            )}
          </div>
        </div>

        {/* Haptic Feedback Test */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">📳 Haptic Feedback Test</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleHapticTest('light')}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Light
            </button>
            <button
              onClick={() => handleHapticTest('medium')}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Medium
            </button>
            <button
              onClick={() => handleHapticTest('heavy')}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Heavy
            </button>
          </div>
        </div>

        {/* Camera & Gallery Test */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">📷 Camera & Gallery</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCameraTest}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Take Photo
            </button>
            <button
              onClick={handleGalleryTest}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Pick from Gallery
            </button>
          </div>
        </div>

        {/* Share Test */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">🔗 Native Share</h2>
          <button
            onClick={handleShareTest}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Test Share Dialog
          </button>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border-l-4 border-pink-500">
            <h2 className="text-lg font-semibold mb-2 text-text-primary">📝 Test Result</h2>
            <p className="text-gray-300">{testResult}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">ℹ️ How to Test</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Build the app: <code className="bg-gray-800 px-2 py-1 rounded">npm run mobile:android</code></li>
            <li>Run on device or emulator</li>
            <li>Test each feature above</li>
            <li>Check for ✅ success messages</li>
          </ol>
          <p className="mt-4 text-sm text-blue-300">
            Note: Features marked with ⚠️ will not work in web browser. You must build and run the native app to test them.
          </p>
        </div>
      </div>
    </div>
  );
}
