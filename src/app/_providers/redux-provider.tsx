"use client";

import { Provider } from "react-redux";
import { store, persistor } from "../../store/store";
import { PersistGate } from "redux-persist/integration/react";
import { useEffect, useState } from "react";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
