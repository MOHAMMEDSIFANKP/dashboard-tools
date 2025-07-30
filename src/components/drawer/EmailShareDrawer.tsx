// EmailShareDrawer.tsx
import React, { useEffect, useState } from 'react';
import { X, Share, Send, Mail, MessageSquare, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailShareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chartTitle: string;
  chartImage: string | null;
  //   onSendEmail: (emailData: EmailData) => Promise<void>;
}

export interface EmailData {
  receiverEmail: string;
  subject: string;
  message: string;
  chartImage: string;
  chartTitle: string;
}

export const EmailShareDrawer: React.FC<EmailShareDrawerProps> = ({
  isOpen,
  onClose,
  chartTitle,
  chartImage,
  //   onSendEmail
}) => {
  const [receiverEmail, setReceiverEmail] = useState('');
  const [subject, setSubject] = useState(`Chart Report: ${chartTitle}`);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!receiverEmail.trim()) {
      newErrors.receiverEmail = 'Receiver email is required';
    } else if (!validateEmail(receiverEmail)) {
      newErrors.receiverEmail = 'Please enter a valid email address';
    }

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!message.trim()) {
      newErrors.message = 'Message is required';
    }

    if (!chartImage) {
      newErrors.chartImage = 'Chart screenshot is not available';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendEmail = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      //   await onSendEmail({
      //     receiverEmail: receiverEmail.trim(),
      //     subject: subject.trim(),
      //     message: message.trim(),
      //     chartImage: chartImage!,
      //     chartTitle
      //   });

      // Reset form on success
      setReceiverEmail('');
      setSubject(``);
      setMessage('');
      setErrors({});
      onClose();
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);

    } catch (error) {
      setErrors({ general: 'Failed to send email. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  useEffect(() => {
    if (chartTitle) {
      setSubject(`Chart Report: ${chartTitle}`);
    }
  }, [chartTitle])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <Share className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Share Chart</h2>
                    <p className="text-sm text-gray-600">{chartTitle}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 space-y-6">
                {/* Chart Preview */}
                {chartImage && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Chart Preview</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
                      <img
                        src={chartImage}
                        alt={chartTitle}
                        className="w-full min-h-32 object-contain rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* General Error */}
                {errors.general && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{errors.general}</p>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Receiver Email */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <User className="w-4 h-4" />
                      <span>Receiver Email *</span>
                    </label>
                    <input
                      type="email"
                      value={receiverEmail}
                      onChange={(e) => setReceiverEmail(e.target.value)}
                      placeholder="Enter recipient's email address"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.receiverEmail ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {errors.receiverEmail && (
                      <p className="text-sm text-red-600">{errors.receiverEmail}</p>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <Mail className="w-4 h-4" />
                      <span>Subject *</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter email subject"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.subject ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {errors.subject && (
                      <p className="text-sm text-red-600">{errors.subject}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <MessageSquare className="w-4 h-4" />
                      <span>Message *</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter your message"
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${errors.message ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                    />
                    {errors.message && (
                      <p className="text-sm text-red-600">{errors.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={isLoading || !chartImage}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
      {showSuccessPopup && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="fixed bottom-6 right-6 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2"
        >
          <Mail className="w-5 h-5" />
          <span>Email sent successfully</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};