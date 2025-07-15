// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import React from 'react';

import { Helmet } from 'react-helmet';

type Props = {
  description?: string;
  children: any | any[];
  title?: string;
};

const PageContainer = ({ title, description, children }: Props) => (
  <div style={{ paddingTop: '16px' }}>
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
    </Helmet>
    {children}
  </div>
);

export default PageContainer;
