import { createContext, Component, Context } from "react";

export interface ConfigState {
  chartCount: number;
  upperBound: number;
  lowerBound: number;
  useWeights: boolean;
  weights: number[];
  forceDistribution: boolean;
  style: string;
  difficulties: ReadonlySet<string>;
  flags: ReadonlySet<string>;
  showPool: boolean;
  update(mutator: (state: ConfigState) => ConfigState): void;
}

export const ConfigStateContext = createContext(
  null
) as unknown as Context<ConfigState>;

interface Props {}

export class ConfigStateManager extends Component<Props, ConfigState> {
  constructor(props: Props) {
    super(props);
    this.state = {
      chartCount: 5,
      upperBound: 0,
      lowerBound: 0,
      useWeights: true,
      weights: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1, 0],
      forceDistribution: true,
      style: "",
      difficulties: new Set(),
      flags: new Set(),
      showPool: false,
      update: this.update,
    };
  }

  public render() {
    return (
      <ConfigStateContext.Provider value={this.state}>
        {this.props.children}
      </ConfigStateContext.Provider>
    );
  }

  private update = (mutator: (state: ConfigState) => ConfigState) => {
    this.setState(mutator);
  };
}
