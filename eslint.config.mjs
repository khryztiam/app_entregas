import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...nextVitals,
  {
    ignores: ['.history/**'],
  },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off', // Desabilitar regla experimental de React 19 que prohíbe Date.now() en useMemo
    },
  },
];

export default eslintConfig;
