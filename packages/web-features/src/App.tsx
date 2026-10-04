import { createHashRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider, I18nProvider } from '@balloo/ui';
import { FeaturesListScreen } from './screens/FeaturesListScreen';
import { FeatureDetailScreen } from './screens/FeatureDetailScreen';
import { FeatureCreateScreen } from './screens/FeatureCreateScreen';

const router = createHashRouter([
  { path: '/', element: <FeaturesListScreen /> },
  { path: '/features', element: <FeaturesListScreen /> },
  { path: '/features/create', element: <FeatureCreateScreen /> },
  { path: '/features/:id', element: <FeatureDetailScreen /> },
]);

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
