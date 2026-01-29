
import React, { useEffect, useRef } from 'react';
import { engineInstance } from '@/engine/engine';
import { registerCoreModules } from '@/engine/modules/CoreModules';
import { toolRegistry } from '@/editor/registries/ToolRegistry';
import { TransformToolOptions } from '@/editor/toolOptions/TransformToolOptions';
import { SelectToolInfo } from '@/editor/toolOptions/SelectToolInfo';
import { useEngineAPI } from '@/engine/api/EngineProvider';

export const EditorBoot: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const initialized = useRef(false);
    const api = useEngineAPI();

    if (!initialized.current) {
        registerCoreModules(engineInstance.physicsSystem, engineInstance.particleSystem, engineInstance.animationSystem);
        
        // Register Tool UIs
        toolRegistry.register('SELECT', SelectToolInfo);
        toolRegistry.register('MOVE', TransformToolOptions);
        toolRegistry.register('ROTATE', TransformToolOptions);
        toolRegistry.register('SCALE', TransformToolOptions);
        
        initialized.current = true;
    }

    // EXPOSE GLOBALS FOR CONSOLE CHEATS/DEBUGGING
    useEffect(() => {
        (window as any).ti3d = { engine: engineInstance, api };
        console.log("Global access enabled: window.ti3d.engine, window.ti3d.api");
    }, [api]);

    return <>{children}</>;
};
