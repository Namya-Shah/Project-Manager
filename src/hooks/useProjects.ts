import { useState, useEffect } from 'react';
import { Project, DailyLog } from '@/types/project';

const STORAGE_KEY = 'devlog-projects';

const generateId = () => Math.random().toString(36).substr(2, 9);

const getInitialProjects = (): Project[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Demo data
  const today = new Date();
  const demoProjects: Project[] = [
    {
      id: generateId(),
      name: 'Portfolio Website',
      description: 'Personal portfolio with React and Three.js',
      color: '#22c55e',
      createdAt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      logs: [
        {
          id: generateId(),
          date: today.toISOString().split('T')[0],
          content: 'Added hero section with animated background',
          createdAt: today.toISOString(),
        },
        {
          id: generateId(),
          date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          content: 'Implemented responsive navigation',
          createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: generateId(),
          date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          content: 'Set up project structure and dependencies',
          createdAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      id: generateId(),
      name: 'Task Manager API',
      description: 'RESTful API with Node.js and PostgreSQL',
      color: '#3b82f6',
      createdAt: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      logs: [
        {
          id: generateId(),
          date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          content: 'Added authentication middleware',
          createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: generateId(),
          date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          content: 'Implemented CRUD endpoints for tasks',
          createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
  ];
  
  return demoProjects;
};

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>(getInitialProjects);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const addProject = (name: string, description: string, color: string) => {
    const newProject: Project = {
      id: generateId(),
      name,
      description,
      color,
      createdAt: new Date().toISOString(),
      logs: [],
    };
    setProjects((prev) => [...prev, newProject]);
    return newProject;
  };

  const deleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const addLog = (projectId: string, content: string, date?: string) => {
    const logDate = date || new Date().toISOString().split('T')[0];
    const newLog: DailyLog = {
      id: generateId(),
      date: logDate,
      content,
      createdAt: new Date().toISOString(),
    };
    
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? { ...project, logs: [...project.logs, newLog] }
          : project
      )
    );
    return newLog;
  };

  const deleteLog = (projectId: string, logId: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? { ...project, logs: project.logs.filter((log) => log.id !== logId) }
          : project
      )
    );
  };

  const getProject = (projectId: string) => {
    return projects.find((p) => p.id === projectId);
  };

  return {
    projects,
    addProject,
    deleteProject,
    addLog,
    deleteLog,
    getProject,
  };
};
