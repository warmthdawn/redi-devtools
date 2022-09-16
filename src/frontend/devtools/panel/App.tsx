import React from "react";
import { DependencyView } from "~/frontend/components/dependency-view";
import { DependencyGraph } from "~/frontend/components/graph";
import { DependencyDataModel } from "~/frontend/model/dependency-model";
import { InjectorModel } from "~/frontend/model/injector-model";
import { ModelContext } from "~/frontend/utils/hooks";
import "./App.css";

function App() {
  return (
    <main>
      <ModelContext.Provider value={{
        injectorModel: new InjectorModel(),
        dependencyModel: new DependencyDataModel(),
      }}>
        <DependencyView />
      </ModelContext.Provider>
    </main>
  );
}

export default App;
