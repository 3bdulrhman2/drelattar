import React from 'react';
import { AdminLogin } from '../admin/AdminLogin';
export const SecretaryLogin: React.FC<{onBackToSite:()=>void; onLoginSuccess?:unknown}> = ({onBackToSite}) =>
  <AdminLogin onBackToSite={onBackToSite} />;
