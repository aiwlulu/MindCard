import React from "react";
import { RaceBy } from "@uiball/loaders";

export default function Loading() {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-opacity-50 z-50">
      <RaceBy size={80} lineWeight={5} speed={1.4} color="white" />
    </div>
  );
}
