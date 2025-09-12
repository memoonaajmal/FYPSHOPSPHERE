"use client";
import { Provider } from "react-redux";
import { ReduxStore } from "../../redux/ReduxStore";

export function ReduxProvider({ children }) {
  return <Provider store={ReduxStore}>{children}</Provider>;
}
