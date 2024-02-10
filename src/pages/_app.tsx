import { api } from '~/utils/api';
import { type AppType } from 'next/app';
import '~/styles/globals.css';
// fixes a bug where icons are extra large on the first load.
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

config.autoAddCss = false;

const MyApp: AppType = ({ Component, pageProps }) => {
  return <Component {...pageProps} />;
};

export default api.withTRPC(MyApp);
