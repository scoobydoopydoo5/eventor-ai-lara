declare module "react-mouse-particles" {
  import * as React from "react";

  interface MouseParticlesProps {
    g?: number;
    color?: string;
    cull?: string;
    num?: number;
    radius?: number;
    life?: number;
  }

  export default class MouseParticles extends React.Component<MouseParticlesProps> {}
}
