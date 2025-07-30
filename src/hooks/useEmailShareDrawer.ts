// hooks/useEmailShareDrawer.ts
import { useState, useCallback } from 'react';

export const useEmailShareDrawer = () => {
  const [emailDrawer, setEmailDrawer] = useState<{
    isOpen: boolean;
    chartTitle: string;
    chartImage: string | null;
  }>({
    isOpen: false,
    chartTitle: '',
    chartImage: null
  });

  const handleOpenDrawer = (title: string, imageData: string) => {
    setEmailDrawer({
      isOpen: true,
      chartTitle: title,
      chartImage: imageData
    });
  };

  const handleCloseDrawer = useCallback(() => {
    setEmailDrawer({
      isOpen: false,
      chartTitle: '',
      chartImage: null
    });
  }, []);

  return {
    emailDrawer,
    handleOpenDrawer,
    handleCloseDrawer
  };
};
