# Components Usage Guide

## Layout Component
The `Layout` component provides a complete page structure with sidebar and navbar. It automatically handles:
- Active page highlighting based on current route
- Navigation between pages
- User information display

### Usage with Layout (Recommended)
```jsx
import Layout from "../components/Layout";

const MyPage = () => {
  return (
    <Layout>
      <div>Your page content here</div>
    </Layout>
  );
};
```

### Usage without Layout (Advanced)
If you need more control, you can use Sidebar and Navbar separately:

```jsx
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const MyPage = () => {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="flex h-screen">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <div className="flex-1 flex flex-col">
        <Navbar userName="Your Name" />
        <main className="flex-1 bg-gray-50 p-4">
          Your content here
        </main>
      </div>
    </div>
  );
};
```

## Props

### Layout Props
- `children`: React elements to render in the main content area
- `userName`: (optional) User name to display in navbar (default: "Usama Rasheed")

### Sidebar Props
- `activePage`: Current active page ID
- `onPageChange`: Function to call when a navigation item is clicked

### Navbar Props
- `userName`: User name to display in the navbar

## Available Pages
- dashboard
- assessment
- fitness
- nutrition
- community
