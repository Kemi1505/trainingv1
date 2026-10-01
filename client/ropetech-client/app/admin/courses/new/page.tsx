'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/Button';
import { ErrorAlert } from '@/components/ErrorAlert';
import {
  addContentItem,
  addQuestion,
  createCourse,
  deleteContentItem,
  deleteQuestion,
  getAccessToken,
  publishCourse,
  updateCourse,
  type ContentItem,
  type CourseDifficulty,
  type JwtPayload,
  type Question,
  type QuestionOption,
} from '@/lib/api';
import { decodeJwt } from '@/lib/jwt';

const STEPS = ['Basic Information', 'Course Content', 'Learning Outcomes', 'Requirements', 'Assessment'];

export default function NewCoursePage() {
  const router = useRouter();
  const email = decodeJwt<JwtPayload>(getAccessToken() ?? '')?.email;

  const [step, setStep] = useState(0);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Step 1 — Basic Information
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<CourseDifficulty>('BEGINNER');
  const [picture, setPicture] = useState<File | null>(null);

  // Step 2 — Course Content
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [contentTitle, setContentTitle] = useState('');
  const [contentFile, setContentFile] = useState<File | null>(null);

  // Step 3 — Learning Outcomes
  const [outcomes, setOutcomes] = useState<string[]>(['']);

  // Step 4 — Requirements
  const [requirements, setRequirements] = useState('');
  const [requiresPreviousCertification, setRequiresPreviousCertification] = useState(false);

  // Step 5 — Assessment
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<QuestionOption[]>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
  ]);

  async function handleBasicsSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const created = await createCourse(
        {
          title,
          description,
          price: Number(price),
          category: category || undefined,
          difficulty,
        },
        picture,
      );
      setCourseId(created.id);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddContent() {
    if (!courseId || !contentTitle || !contentFile) return;
    setError(null);
    try {
      const item = await addContentItem(courseId, contentTitle, contentItems.length, contentFile);
      setContentItems((prev) => [...prev, item]);
      setContentTitle('');
      setContentFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add content');
    }
  }

  async function handleRemoveContent(contentId: string) {
    if (!courseId) return;
    try {
      await deleteContentItem(courseId, contentId);
      setContentItems((prev) => prev.filter((c) => c.id !== contentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove content');
    }
  }

  async function handleOutcomesNext() {
    if (!courseId) return;
    setError(null);
    setSaving(true);
    try {
      await updateCourse(courseId, { learningOutcomes: outcomes.filter((o) => o.trim()) });
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save learning outcomes');
    } finally {
      setSaving(false);
    }
  }

  async function handleRequirementsNext() {
    if (!courseId) return;
    setError(null);
    setSaving(true);
    try {
      await updateCourse(courseId, {
        requirements: requirements || undefined,
        requiresPreviousCertification,
      });
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save requirements');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddQuestion() {
    if (!courseId) return;
    const trimmedOptions = options.map((o) => ({ ...o, text: o.text.trim() }));
    if (!questionText.trim() || trimmedOptions.some((o) => !o.text)) {
      setError('Fill in the question text and every option before adding it');
      return;
    }
    if (!trimmedOptions.some((o) => o.isCorrect)) {
      setError('Mark one option as the correct answer');
      return;
    }
    setError(null);
    try {
      const question = await addQuestion(courseId, questionText, trimmedOptions, questions.length);
      setQuestions((prev) => [...prev, question]);
      setQuestionText('');
      setOptions([
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question');
    }
  }

  async function handleRemoveQuestion(questionId: string) {
    if (!courseId) return;
    try {
      await deleteQuestion(courseId, questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove question');
    }
  }

  async function handleFinish(publish: boolean) {
    if (!courseId) return;
    setError(null);
    setSaving(true);
    try {
      if (publish) await publishCourse(courseId);
      router.push('/admin/courses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish course');
    } finally {
      setSaving(false);
    }
  }

  function handlePictureChange(e: ChangeEvent<HTMLInputElement>) {
    setPicture(e.target.files?.[0] ?? null);
  }

  function handleContentFileChange(e: ChangeEvent<HTMLInputElement>) {
    setContentFile(e.target.files?.[0] ?? null);
  }

  function updateOutcome(index: number, value: string) {
    setOutcomes((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function updateOptionText(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text: value } : o)));
  }

  function setCorrectOption(index: number) {
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));
  }

  return (
    <AdminLayout email={email}>
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-2xl font-bold text-brand-800">Create Course</h1>

        {/* Step indicator */}
        <div className="mt-6 flex flex-wrap gap-2">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                i === step
                  ? 'bg-brand-700 text-white'
                  : i < step
                    ? 'bg-brand-50 text-brand-700'
                    : 'bg-white text-black border border-brand-100'
              }`}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6">
            <ErrorAlert message={error} />
          </div>
        )}

        <div className="mt-8 rounded-lg border border-brand-100 bg-white p-6 shadow-sm">
          {/* Step 1 — Basic Information */}
          {step === 0 && (
            <form onSubmit={handleBasicsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black">Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black">Description</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black">Price</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Category</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Rigging"
                    className="mt-1 w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as CourseDifficulty)}
                  className="mt-1 w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black">
                  Picture <span className="text-black/60">(optional)</span>
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePictureChange}
                  className="mt-1 block w-full text-sm text-black file:mr-4 file:rounded-md file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Next'}
              </Button>
            </form>
          )}

          {/* Step 2 — Course Content */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-3">
                {contentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-md border border-brand-100 px-4 py-3"
                  >
                    <span className="text-sm text-black">{item.title}</span>
                    <button
                      onClick={() => handleRemoveContent(item.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {contentItems.length === 0 && (
                  <p className="text-sm text-black">No manuals added yet.</p>
                )}
              </div>

              <div className="rounded-md border border-dashed border-brand-200 p-4">
                <label className="block text-sm font-medium text-black">Lesson title</label>
                <input
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <label className="mt-3 block text-sm font-medium text-black">
                  PDF manual
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleContentFileChange}
                  className="mt-1 block w-full text-sm text-black file:mr-4 file:rounded-md file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={handleAddContent}
                  disabled={!contentTitle || !contentFile}
                >
                  Add lesson
                </Button>
              </div>

              <Button onClick={() => setStep(2)}>Next</Button>
            </div>
          )}

          {/* Step 3 — Learning Outcomes */}
          {step === 2 && (
            <div className="space-y-4">
              {outcomes.map((outcome, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={outcome}
                    onChange={(e) => updateOutcome(i, e.target.value)}
                    placeholder="What will learners be able to do?"
                    className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {outcomes.length > 1 && (
                    <button
                      onClick={() => setOutcomes((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setOutcomes((prev) => [...prev, ''])}
              >
                Add outcome
              </Button>
              <div>
                <Button onClick={handleOutcomesNext} disabled={saving}>
                  {saving ? 'Saving…' : 'Next'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 — Requirements */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black">
                  Other requirements <span className="text-black/60">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="mt-1 w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <fieldset>
                <legend className="text-sm font-medium text-black">
                  Does this course require a previous certification?
                </legend>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-black">
                    <input
                      type="radio"
                      checked={requiresPreviousCertification}
                      onChange={() => setRequiresPreviousCertification(true)}
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-sm text-black">
                    <input
                      type="radio"
                      checked={!requiresPreviousCertification}
                      onChange={() => setRequiresPreviousCertification(false)}
                    />
                    No
                  </label>
                </div>
              </fieldset>
              <Button onClick={handleRequirementsNext} disabled={saving}>
                {saving ? 'Saving…' : 'Next'}
              </Button>
            </div>
          )}

          {/* Step 5 — Assessment */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-3">
                {questions.map((q) => (
                  <div key={q.id} className="rounded-md border border-brand-100 px-4 py-3">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium text-black">{q.text}</span>
                      <button
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {q.options.map((o) => (
                        <li key={o.id} className="text-xs text-black">
                          {o.isCorrect ? '✓ ' : '• '}
                          {o.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {questions.length === 0 && (
                  <p className="text-sm text-black">No questions added yet.</p>
                )}
              </div>

              <div className="rounded-md border border-dashed border-brand-200 p-4">
                <label className="block text-sm font-medium text-black">Question</label>
                <input
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="mt-1 w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />

                <div className="mt-3 space-y-2">
                  {options.map((option, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={option.isCorrect}
                        onChange={() => setCorrectOption(i)}
                        title="Mark as correct answer"
                      />
                      <input
                        value={option.text}
                        onChange={(e) => updateOptionText(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        className="w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOptions((prev) => [...prev, { text: '', isCorrect: false }])}
                  >
                    Add option
                  </Button>
                  <Button type="button" onClick={handleAddQuestion}>
                    Add question
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 border-t border-brand-100 pt-6">
                <Button variant="outline" onClick={() => handleFinish(false)} disabled={saving}>
                  Save as Draft
                </Button>
                <Button onClick={() => handleFinish(true)} disabled={saving}>
                  {saving ? 'Publishing…' : 'Publish Course'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
