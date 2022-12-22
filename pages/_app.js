import "../styles/globals.css";
import { QueryClient, QueryClientProvider } from "react-query";

export const queryClient = new QueryClient();

export function invalidateQueries(queryKeys) {
  queryClient.invalidateQueries({ queryKey: queryKeys });
}

export default function App({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
