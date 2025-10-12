import React, { useState, useEffect } from 'react';
import {
  Filter,
  Search,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  User,
  Calendar,
  TrendingUp,
  FileText,
  Flag,
  Eye,
  Send
} from 'lucide-react';

interface Conversation {
  id: string;
  userId: string;
  userHash: string;
  model: string;
  messageCount: number;
  createdAt: string;
  status: 'pending' | 'evaluated' | 'flagged';
  type: 'support' | 'creative' | 'technical' | 'analysis';
  title: string;
  preview: string;
  existingEvaluation?: Evaluation;
}

interface Evaluation {
  id: string;
  conversationId: string;
  expertId: string;
  evaluatedAt: string;
  scores: {
    accuracy: number;
    helpfulness: number;
    coherence: number;
    safety: number;
    efficiency: number;
    overall: number;
  };
  feedback: string;
  issues: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  flags: string[];
  suggestions: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokenCount?: number;
}

export default function ExpertsEvaluation() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('7days');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Evaluation form
  const [scores, setScores] = useState({
    accuracy: 0,
    helpfulness: 0,
    coherence: 0,
    safety: 0,
    efficiency: 0,
  });
  const [feedback, setFeedback] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [suggestions, setSuggestions] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    evaluated: 0,
    flagged: 0,
    avgEvaluationTime: 0,
  });

  // Fetch conversations
  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: filterStatus,
        type: filterType === 'all' ? '' : filterType,
        dateRange: filterDate,
        search: searchQuery,
      });
      
      const response = await fetch(`/api/expertos/conversations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch conversation details
  const fetchConversationDetails = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/expertos/conversation/${conversationId}/details`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        if (data.evaluation) {
          // Load existing evaluation
          setScores(data.evaluation.scores);
          setFeedback(data.evaluation.feedback || '');
          setIssues(data.evaluation.issues || []);
          setSeverity(data.evaluation.severity || 'low');
          setSuggestions(data.evaluation.suggestions || '');
        }
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error);
    }
  };

  // Submit evaluation
  const submitEvaluation = async () => {
    if (!selectedConversation) return;
    
    setIsEvaluating(true);
    try {
      const overall = (scores.accuracy + scores.helpfulness + scores.coherence + scores.safety + scores.efficiency) / 5;
      
      const evaluation = {
        conversationId: selectedConversation.id,
        scores: {
          ...scores,
          overall,
        },
        feedback,
        issues,
        severity,
        suggestions,
      };
      
      const response = await fetch('/api/expertos/evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluation),
      });
      
      if (response.ok) {
        // Reset form
        resetEvaluationForm();
        // Refresh conversations list
        await fetchConversations();
        // Close conversation view
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Reset evaluation form
  const resetEvaluationForm = () => {
    setScores({
      accuracy: 0,
      helpfulness: 0,
      coherence: 0,
      safety: 0,
      efficiency: 0,
    });
    setFeedback('');
    setIssues([]);
    setSeverity('low');
    setSuggestions('');
  };

  // Toggle issue
  const toggleIssue = (issue: string) => {
    setIssues(prev =>
      prev.includes(issue)
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    );
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [filterStatus, filterType, filterDate]);

  // Load conversation details when selected
  useEffect(() => {
    if (selectedConversation) {
      fetchConversationDetails(selectedConversation.id);
    } else {
      setMessages([]);
      resetEvaluationForm();
    }
  }, [selectedConversation]);

  // Render star rating
  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={`w-6 h-6 ${
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (selectedConversation) {
    // Evaluation view
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <button
              onClick={() => setSelectedConversation(null)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2"
            >
              ← Back to Conversations
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Evaluate Conversation
            </h1>
            <p className="text-gray-600 mt-1">
              Conversation #{selectedConversation.id.slice(-8)} • {selectedConversation.model}
            </p>
          </div>
        </div>

        {/* Conversation Display */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 max-h-96 overflow-y-auto">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversation History ({messages.length} messages)
          </h2>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="text-xs font-semibold mb-1 opacity-75">
                    {message.role === 'user' ? 'User' : 'Assistant'}
                    {message.tokenCount && ` • ${message.tokenCount} tokens`}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluation Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Quality Assessment
          </h2>

          <div className="space-y-6">
            {/* Scores */}
            {Object.entries(scores).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {key}
                </label>
                <StarRating
                  value={value}
                  onChange={(v) => setScores(prev => ({ ...prev, [key]: v }))}
                />
              </div>
            ))}

            {/* Overall Score (calculated) */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Overall Score</span>
                <span className="text-2xl font-bold text-blue-600">
                  {((scores.accuracy + scores.helpfulness + scores.coherence + scores.safety + scores.efficiency) / 5).toFixed(1)} / 5.0
                </span>
              </div>
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide detailed feedback on the conversation quality..."
              />
            </div>

            {/* Issues */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issues Identified
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Factual error', 'Unhelpful response', 'Unclear language', 'Safety concern', 'Inefficient tokens', 'Other'].map(issue => (
                  <button
                    key={issue}
                    onClick={() => toggleIssue(issue)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                      issues.includes(issue)
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {issues.includes(issue) ? '✓ ' : ''}{issue}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Severity
              </label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high', 'critical'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setSeverity(level)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                      severity === level
                        ? level === 'critical' ? 'bg-red-600 text-white'
                          : level === 'high' ? 'bg-orange-600 text-white'
                          : level === 'medium' ? 'bg-yellow-600 text-white'
                          : 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Improvement Suggestions
              </label>
              <textarea
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Suggest improvements for future conversations..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                onClick={submitEvaluation}
                disabled={isEvaluating || Object.values(scores).some(s => s === 0)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Evaluation
              </button>
              <button
                onClick={() => setSelectedConversation(null)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Conversations list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">👨‍💼 Expert Evaluation</h1>
        <p className="text-gray-600 mt-1">
          Review and assess conversation quality
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Pending</span>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Evaluated</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.evaluated}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Flagged</span>
            <Flag className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.flagged}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Avg Time</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.avgEvaluationTime}m</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="evaluated">Evaluated</option>
            <option value="flagged">Flagged</option>
            <option value="all">All</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="support">Support</option>
            <option value="creative">Creative</option>
            <option value="technical">Technical</option>
            <option value="analysis">Analysis</option>
          </select>

          {/* Date Range */}
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1day">Last 24 hours</option>
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center text-gray-600">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No conversations found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{conversation.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        conversation.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                        : conversation.status === 'evaluated' ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                        {conversation.status}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full capitalize">
                        {conversation.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{conversation.preview}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {conversation.userHash}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {conversation.messageCount} messages
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(conversation.createdAt).toLocaleDateString()}
                      </span>
                      <span className="font-mono">{conversation.model}</span>
                    </div>
                  </div>
                  <button className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Evaluate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

