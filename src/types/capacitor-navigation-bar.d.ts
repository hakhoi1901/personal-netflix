declare module '@hugotomazi/capacitor-navigation-bar' {
    export interface NavigationBarPlugin {
        hide(): Promise<void>;
        show(): Promise<void>;
        setColor(options: { color: string }): Promise<void>;
        setTransparency(options: { isTransparent: boolean }): Promise<void>;
        getColor(): Promise<{ color: string }>;
    }
    const NavigationBar: NavigationBarPlugin;
    export { NavigationBar };
}
