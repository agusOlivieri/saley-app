import "lucide-react-native";
import { ColorValue } from "react-native";

declare module "lucide-react-native" {
  export interface LucideProps {
    color?: ColorValue;
  }
}
