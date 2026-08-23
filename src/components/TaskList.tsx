/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Check, Trash2, Calendar, AlertCircle, Sparkles, Filter } from 'lucide-react';
import { Task, Subject } from '../types';

interface TaskListProps {
  tasks: Task[];
  subjects: Subject[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskList({ tasks, subjects, onAddTask, onToggleTask, onDeleteTask }: TaskListProps) {
  const [title, setTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    if (subjects.length > 0 && (!selectedSubjectId || !subjects.some(s => s.id === selectedSubjectId))) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      subjectId: selectedSubjectId,
      priority,
      status: 'todo',
      deadline
    });

    setTitle('');
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSub = filterSubject === 'all' || t.subjectId === filterSubject;
      const matchPrio = filterPriority === 'all' || t.priority === filterPriority;
      return matchSub && matchPrio;
    });
  }, [tasks, filterSubject, filterPriority]);

  const subjectMap = useMemo(() => {
    const map: { [id: string]: Subject } = {};
    subjects.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [subjects]);

  return (
    <div className="space-y-6 text-right" style={{ direction: 'rtl' }}>
      {/* Create Task Form */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          إضافة مهمة جديدة لمذاكرتها
        </h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">عنوان المهمة:</label>
              <input
                type="text"
                placeholder="مثال: حل الباب الأول كيمياء، مذاكرة نحو.."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-950 dark:text-zinc-50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">المادة المرتبطة:</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-950 dark:text-zinc-50"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">الأولوية:</label>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      priority === p
                        ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 border-transparent shadow-sm'
                        : 'bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {p === 'high' ? 'عالية 🔥' : p === 'medium' ? 'متوسطة ⚡' : 'منخفضة 💤'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">تاريخ التسليم (الديدلاين):</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-400 text-zinc-950 dark:text-zinc-50"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 font-semibold rounded-xl text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة المهمة للجدول</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Task Listing */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">المهام المضافة الحالية</h4>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="bg-transparent text-xs text-zinc-600 dark:text-zinc-400 focus:outline-none"
              >
                <option value="all">كل المواد</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-transparent text-xs text-zinc-600 dark:text-zinc-400 focus:outline-none"
              >
                <option value="all">كل الأولويات</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>
          </div>
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-zinc-500">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-zinc-400" />
            <p className="text-sm font-semibold">لا يوجد مهام مطابقة للمرشحات الحالية.</p>
            <p className="text-xs text-zinc-400 mt-1">ابدأ بملء جدولك لإبقاء عقلك متيقظاً ومنظماً.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const sub = subjectMap[task.subjectId];
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                    task.status === 'done'
                      ? 'bg-zinc-50/50 dark:bg-zinc-900/10 border-zinc-100 dark:border-zinc-900/50 opacity-60'
                      : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        task.status === 'done'
                          ? 'bg-emerald-500 border-transparent text-white'
                          : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      {task.status === 'done' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <h5 className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                        {task.title}
                      </h5>
                      <div className="flex items-center gap-2 mt-1">
                        {sub && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full text-zinc-50 font-medium"
                            style={{ backgroundColor: sub.color }}
                          >
                            {sub.name}
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          task.priority === 'high' ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' : task.priority === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' : 'bg-zinc-100 text-zinc-500'
                        }`}>
                          {task.priority === 'high' ? 'عاجل' : task.priority === 'medium' ? 'متوسط' : 'خفيف'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      {task.deadline}
                    </span>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
