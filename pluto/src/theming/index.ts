import { synnaxDark, synnaxLight } from "./theme";
export * from "./hooks";
import {
  ThemeProvider,
  ThemeSwitch,
  useThemeContext,
  useThemeProvider,
} from "./ThemeContext";
export type { Theme } from "./theme";
export type { ThemeProviderProps } from "./ThemeContext";

export const Theming = {
  Provider: ThemeProvider,
  Switch: ThemeSwitch,
  useContext: useThemeContext,
  useProvider: useThemeProvider,
  themes: { synnaxDark, synnaxLight },
};