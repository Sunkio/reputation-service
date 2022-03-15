import { extendTheme } from "@chakra-ui/react"
import styles from "./styles"
import colors from "./colors"
import components from "./components"
import theme from "./theme"

const config = {
    ...theme,
    fonts: {
        heading: "Inter, sans-serif",
        body: "Inter, sans-serif"
    },
    colors,
    styles,
    components
}

export default extendTheme(config)
