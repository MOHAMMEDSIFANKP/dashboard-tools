'use client';

import React, { useMemo, useState } from 'react';
import { CompactTable} from '@table-library/react-table-library/compact';
import {
  useTheme,
} from '@table-library/react-table-library/theme';
import { getTheme } from '@table-library/react-table-library/baseline';
import { useSort } from "@table-library/react-table-library/sort";

export interface User {
  id: number;
  name: string;
  age: number;
  email: string;
  role: string;
}

const users: User[] = [
  { id: 1, name: 'Alice', age: 25, email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob', age: 30, email: 'bob@example.com', role: 'User' },
  { id: 3, name: 'Charlie', age: 28, email: 'charlie@example.com', role: 'Manager' },
  { id: 4, name: 'Diana', age: 35, email: 'diana@example.com', role: 'Admin' },
  { id: 5, name: 'Ethan', age: 40, email: 'ethan@example.com', role: 'User' },
  { id: 6, name: 'Frank', age: 45, email: 'frank@example.com', role: 'Manager' },
  { id: 7, name: 'Grace', age: 29, email: 'grace@example.com', role: 'User' },
];

export default function ReactTable() {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');

  const theme = useTheme([
    getTheme(),
    {
      Table: `
        --data-table-library_grid-template-columns: 20% 20% 20% 20% 20%;
      `,
    },
  ]);

  const filteredData = useMemo(() => {
    let result = users;

    if (search) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterRole !== 'All') {
      result = result.filter((item) => item.role === filterRole);
    }

    return { nodes: result };
  }, [search, filterRole]);

  // const sort = useSort(filteredData, {
  //   onChange: onSortChange,
  // });

  // function onSortChange(action: any, state: any) {
  //   console.log('Sorting:', action, state);
  // }

  // const pagination = usePagination(filteredData, {
  //   state: {
  //     page: 0,
  //     size: 5,
  //   },
  //   onChange: onPaginationChange,
  // });

  // const sort = useSort(
  //   filteredData,
  //   {
  //     onChange: onSortChange,
  //   },
  //   {
  //     sortFns: {
  //       NAME: (array) => array.sort((a, b) => a.name.localeCompare(b.name)),
  //       AGE: (array) => array.sort((a, b) => a.age - b.age),
  //       EMAIL: (array) => array.sort((a, b) => a.email.localeCompare(b.email)),
  //       ROLE: (array) => array.sort((a, b) => a.role.localeCompare(b.role)),
  //     },
  //   }
  // );
  
  // function onSortChange(action, state) {
  //   console.log("Sort changed:", action, state);
  // }
  

  function onPaginationChange(action: any, state: any) {
    console.log('Pagination:', action, state);
  }

  const COLUMNS = [
    { label: 'ID', renderCell: (item: User) => item.id },
    { label: 'Name', renderCell: (item: User) => item.name, sort: { sortKey: 'NAME' } },
    { label: 'Age', renderCell: (item: User) => item.age, sort: { sortKey: 'AGE' } },
    { label: 'Email', renderCell: (item: User) => item.email },
    { label: 'Role', renderCell: (item: User) => item.role },
  ];

  return (
    <section className="p-8">
      <h1 className="text-2xl font-bold mb-4">User Table</h1>

      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or email"
          className="border px-3 py-2 rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border px-3 py-2 rounded"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="All">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="User">User</option>
          <option value="Manager">Manager</option>
        </select>
      </div>

      <CompactTable
        columns={COLUMNS}
        data={filteredData}
        theme={theme}
        // sort={sort}
        // pagination={pagination}
      />

      {/* <div className="flex items-center justify-between mt-4">
        <button
          className="px-4 py-2 border rounded"
          disabled={pagination.state.page === 0}
          onClick={() => pagination.fns.onSetPage(pagination.state.page - 1)}
        >
          Previous
        </button>
        <span>
          Page {pagination.state.page + 1} of{' '}
          {Math.ceil(filteredData.nodes.length / pagination.state.size)}
        </span>
        <button
          className="px-4 py-2 border rounded"
          disabled={
            (pagination.state.page + 1) * pagination.state.size >=
            filteredData.nodes.length
          }
          onClick={() => pagination.fns.onSetPage(pagination.state.page + 1)}
        >
          Next
        </button>
      </div> */}
    </section>
  );
}
