import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'

// Register only the Chart.js components we need (tree-shaking)
Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)
