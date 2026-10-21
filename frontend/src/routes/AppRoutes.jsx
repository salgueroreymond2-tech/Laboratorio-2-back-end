import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { ExpensesPage } from '../pages/ExpensesPage.jsx';
import { ExpenseDetailPage } from '../pages/ExpenseDetailPage.jsx';
import { ExpenseFormPage } from '../pages/ExpenseFormPage.jsx';
import { GroupsPage } from '../pages/GroupsPage.jsx';
import { GroupDetailPage } from '../pages/GroupDetailPage.jsx';
import { PeoplePage } from '../pages/PeoplePage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Dashboard principal con métricas globales */}
        <Route index element={<DashboardPage />} />

        {/* Módulo de Gastos Compartidos */}
        <Route path="gastos" element={<ExpensesPage />} />
        <Route path="gastos/nuevo" element={<ExpenseFormPage />} />
        <Route path="gastos/:id" element={<ExpenseDetailPage />} />
        <Route path="gastos/:id/editar" element={<ExpenseFormPage />} />

        {/* Módulo de Grupos, Balances y Liquidaciones */}
        <Route path="grupos" element={<GroupsPage />} />
        <Route path="grupos/:id" element={<GroupDetailPage />} />

        {/* Módulo de Personas */}
        <Route path="personas" element={<PeoplePage />} />

        {/* Ruta 404 No Encontrada */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
