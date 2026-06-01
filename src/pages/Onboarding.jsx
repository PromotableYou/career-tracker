import { useState } from 'react'
import { useData } from '../context/DataContext'
import { CheckCircle, Play } from 'lucide-react'

const STEPS = [
  { label: 'Your Profile' },
  { label: 'Career Blueprint' },
  { label: 'Welcome Video' },
  { label: 'Your 90-Day Goal' },
]

const fieldClass =
  'w-full border border-[#D8E4EC] rounded-lg px-3 py-2 text-sm text-[#263746] focus:outline-none focus:ring-2 focus:ring-[#6D99F2] bg-white placeholder-[#7A8FA3]'
const labelClass = 'block text-sm font-medium text-[#263746] mb-1'
const textareaClass = fieldClass + ' resize-none'

export default function Onboarding({ onComplete }) {
  const { data, updateNested } = useData()
  const [step, setStep] = useState(0) // 0-indexed

  function profileField(field, value) {
    updateNested('profile', field, value)
  }

  function blueprintField(field, value) {
    updateNested('blueprint', field, value)
  }

  const canProceedStep0 = !!(data.profile.name && data.profile.name.trim())
  const canProceedStep2 = !!data.profile.watchedWelcome

  function handleNext() {
    if (step < 3) {
      setStep(step + 1)
    } else {
      updateNested('profile', 'onboardingComplete', true)
      onComplete()
    }
  }

  const isLastStep = step === 3
  const isDisabled =
    (step === 0 && !canProceedStep0) ||
    (step === 2 && !canProceedStep2)
  const canSkip = step === 1 || step === 3

  return (
    <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-[#D8E4EC] shadow-lg p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <span
            className="text-2xl font-bold text-[#263746]"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
          >
            Application Accelerator
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                    i < step
                      ? 'bg-[#263746] border-[#263746] text-white'
                      : i === step
                      ? 'bg-[#6D99F2] border-[#6D99F2] text-white'
                      : 'bg-white border-[#D8E4EC] text-[#7A8FA3]'
                  }`}
                >
                  {i < step ? <CheckCircle size={16} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 transition-all ${
                      i < step ? 'bg-[#263746]' : 'bg-[#D8E4EC]'
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-xs mt-1 text-center ${
                  i === step ? 'text-[#6D99F2] font-medium' : 'text-[#7A8FA3]'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mb-2 text-xs text-[#7A8FA3] font-medium uppercase tracking-wide">
          Step {step + 1} of {STEPS.length}
        </div>

        {/* Step content */}
        <div className="min-h-[320px]">
          {step === 0 && (
            <StepProfile data={data} profileField={profileField} fieldClass={fieldClass} labelClass={labelClass} />
          )}
          {step === 1 && (
            <StepBlueprint data={data} blueprintField={blueprintField} textareaClass={textareaClass} labelClass={labelClass} />
          )}
          {step === 2 && (
            <StepVideo data={data} profileField={profileField} />
          )}
          {step === 3 && (
            <StepGoal data={data} profileField={profileField} textareaClass={textareaClass} labelClass={labelClass} />
          )}
        </div>

        {/* Footer buttons */}
        <div className="mt-8 flex items-center justify-between">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-sm text-[#7A8FA3] hover:text-[#263746] transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {canSkip && !isDisabled && !isLastStep && (
              <button
                onClick={handleNext}
                className="text-sm text-[#7A8FA3] hover:text-[#263746] transition-colors"
              >
                Skip for now →
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isDisabled}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${
                isDisabled
                  ? 'bg-[#7A8FA3] cursor-not-allowed opacity-60'
                  : 'bg-[#263746] hover:bg-[#1a2a35] cursor-pointer'
              }`}
            >
              {isLastStep ? 'Start using my tracker 🚀' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepProfile({ data, profileField, fieldClass, labelClass }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#263746] mb-1">Your Profile</h2>
      <p className="text-sm text-[#7A8FA3] mb-5">
        Let's get you set up. Tell us a bit about yourself and your goals.
      </p>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>
            Name <span className="text-[#FF5E5B]">*</span>
          </label>
          <input
            type="text"
            className={fieldClass}
            value={data.profile.name || ''}
            onChange={e => profileField('name', e.target.value)}
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="text"
            className={fieldClass}
            value={data.profile.email || ''}
            onChange={e => profileField('email', e.target.value)}
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className={labelClass}>Target Role</label>
          <input
            type="text"
            className={fieldClass}
            value={data.profile.targetRole || ''}
            onChange={e => profileField('targetRole', e.target.value)}
            placeholder="e.g. Senior Project Manager"
          />
        </div>
        <div>
          <label className={labelClass}>Program Start Date</label>
          <input
            type="date"
            className={fieldClass}
            value={data.profile.startDate || ''}
            onChange={e => profileField('startDate', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Weekly Application Target</label>
            <input
              type="number"
              className={fieldClass}
              value={data.profile.weeklyAppTarget ?? 5}
              min={0}
              onChange={e => profileField('weeklyAppTarget', Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass}>Weekly Networking Target</label>
            <input
              type="number"
              className={fieldClass}
              value={data.profile.weeklyNetworkTarget ?? 3}
              min={0}
              onChange={e => profileField('weeklyNetworkTarget', Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StepBlueprint({ data, blueprintField, textareaClass, labelClass }) {
  const fields = [
    { key: 'company', label: 'Company', placeholder: 'What kind of company do you want to work for?' },
    { key: 'culture', label: 'Culture', placeholder: 'What culture do you thrive in?' },
    { key: 'team', label: 'Team', placeholder: 'What does your ideal team look like?' },
    { key: 'tasks', label: 'Tasks', placeholder: 'What tasks do you want to be doing?' },
    { key: 'values', label: 'Values', placeholder: 'What values matter most to you at work?' },
    { key: 'salary', label: 'Salary', placeholder: "What's your salary expectation?" },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-[#263746] mb-1">Career Blueprint</h2>
      <p className="text-sm text-[#7A8FA3] mb-5">
        Your Career Blueprint defines what your ideal role looks like. Fill in as much as you can
        — you can always update it later.
      </p>
      <div className="space-y-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className={labelClass}>{f.label}</label>
            <textarea
              className={textareaClass}
              rows={2}
              value={data.blueprint[f.key] || ''}
              placeholder={f.placeholder}
              onChange={e => blueprintField(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function StepVideo({ data, profileField }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8">
      <div className="text-6xl mb-4">🎬</div>
      <h2 className="text-xl font-bold text-[#263746] mb-2">Watch the Welcome Video</h2>
      <p className="text-sm text-[#7A8FA3] mb-8 max-w-sm">
        Before you dive in, watch this short intro from your coach. It covers how to get the most
        out of your tracker.
      </p>

      {/* Placeholder video card */}
      <div className="w-full max-w-sm bg-[#F8F5F2] border border-[#D8E4EC] rounded-xl flex items-center justify-center h-36 mb-6 cursor-pointer group hover:border-[#6D99F2] transition-colors">
        <div className="w-12 h-12 rounded-full bg-[#263746] group-hover:bg-[#6D99F2] flex items-center justify-center transition-colors">
          <Play size={20} className="text-white ml-0.5" />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none group">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            data.profile.watchedWelcome
              ? 'bg-[#263746] border-[#263746]'
              : 'border-[#D8E4EC] group-hover:border-[#6D99F2]'
          }`}
          onClick={() => profileField('watchedWelcome', !data.profile.watchedWelcome)}
        >
          {data.profile.watchedWelcome && <CheckCircle size={14} className="text-white" />}
        </div>
        <span
          className="text-sm text-[#263746] font-medium"
          onClick={() => profileField('watchedWelcome', !data.profile.watchedWelcome)}
        >
          I've watched the welcome video ✓
        </span>
      </label>
    </div>
  )
}

function StepGoal({ data, profileField, textareaClass, labelClass }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#263746] mb-1">Set Your 90-Day Goal</h2>
      <p className="text-sm text-[#7A8FA3] mb-5">
        In one sentence, what does success look like for you in the next 90 days?
      </p>
      <div>
        <label className={labelClass}>Your 90-Day Goal</label>
        <textarea
          className={textareaClass}
          rows={4}
          value={data.profile.ninetyDayGoal || ''}
          placeholder="e.g. Land a Senior Project Manager role in a values-aligned company by September"
          onChange={e => profileField('ninetyDayGoal', e.target.value)}
        />
      </div>
      <p className="mt-3 text-xs text-[#7A8FA3]">
        This goal will be shown on your dashboard to keep you focused. You can update it anytime in
        your profile settings.
      </p>
    </div>
  )
}
