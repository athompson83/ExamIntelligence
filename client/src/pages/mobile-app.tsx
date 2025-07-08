import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  Play, 
  Pause,
  Home,
  Settings,
  BarChart3,
  Calculator,
  Camera,
  Mic,
  MicOff,
  CameraOff,
  ArrowLeft,
  Send,
  MessageCircle,
  X,
  MonitorSpeaker,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  FileText,
  Timer,
  Award,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Flag,
  Volume2,
  VolumeX,
  Share2,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  Info,
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  Search,
  Filter,
  Star,
  Plus,
  Minus,
  Equal,
  Divide,
  RotateCcw,
  Circle,
  Square,
  Triangle,
  Zap,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  MoreHorizontal,
  MoreVertical,
  List,
  Grid,
  Layout,
  Layers,
  Database,
  Server,
  Cloud,
  Wifi as WifiIcon,
  Globe,
  MapPin,
  Navigation,
  Compass,
  Map,
  Route,
  Car,
  Plane,
  Train,
  Bike,
  Truck,
  Bus,
  Ship,
  Anchor,
  Umbrella,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Thermometer,
  Snowflake,
  Droplets,
  Flame,
  Zap as Lightning,
  Mountain,
  TreePine,
  Flower,
  Leaf,
  Sprout,
  Wheat,
  Apple,
  Cherry,
  Grape,
  Banana,
  Orange,
  Carrot,
  Broccoli,
  Corn,
  Mushroom,
  Pepper,
  Tomato,
  Potato,
  Onion,
  Garlic,
  Lemon,
  Lime,
  Coconut,
  Avocado,
  Strawberry,
  Watermelon,
  Pineapple,
  Kiwi,
  Mango,
  Peach,
  Plum,
  Pear,
  Blueberry,
  Raspberry,
  Blackberry,
  Cranberry,
  Olive,
  Walnut,
  Almond,
  Hazelnut,
  Peanut,
  Pistachio,
  Cashew,
  Pecan,
  Macadamia,
  Brazil,
  Pine,
  Sunflower,
  Poppy,
  Rose,
  Tulip,
  Daisy,
  Orchid,
  Lily,
  Violet,
  Jasmine,
  Lavender,
  Sage,
  Mint,
  Basil,
  Oregano,
  Thyme,
  Rosemary,
  Parsley,
  Cilantro,
  Dill,
  Chives,
  Vanilla,
  Cinnamon,
  Nutmeg,
  Ginger,
  Turmeric,
  Paprika,
  Cumin,
  Coriander,
  Cardamom,
  Cloves,
  Allspice,
  Saffron,
  Pepper as PepperSpice,
  Salt,
  Sugar,
  Honey,
  Maple,
  Molasses,
  Syrup,
  Jam,
  Jelly,
  Butter,
  Cream,
  Milk,
  Cheese,
  Yogurt,
  Egg,
  Bacon,
  Ham,
  Sausage,
  Chicken,
  Turkey,
  Duck,
  Beef,
  Pork,
  Lamb,
  Fish,
  Salmon,
  Tuna,
  Shrimp,
  Crab,
  Lobster,
  Oyster,
  Clam,
  Mussel,
  Scallop,
  Squid,
  Octopus,
  Sushi,
  Pizza,
  Burger,
  Sandwich,
  Taco,
  Burrito,
  Pasta,
  Noodle,
  Bread,
  Bagel,
  Croissant,
  Muffin,
  Donut,
  Cake,
  Pie,
  Cookie,
  Chocolate,
  Candy,
  Gum,
  Lollipop,
  Popcorn,
  Pretzel,
  Chips,
  Crackers,
  Nuts,
  Cereal,
  Oatmeal,
  Granola,
  Yogurt as YogurtFood,
  Smoothie,
  Juice,
  Soda,
  Beer,
  Wine,
  Cocktail,
  Coffee,
  Tea,
  Water,
  Ice,
  Soup,
  Salad,
  Stew,
  Casserole,
  Roast,
  Grill,
  Bake,
  Fry,
  Boil,
  Steam,
  Sauté,
  Stir,
  Mix,
  Blend,
  Whisk,
  Chop,
  Slice,
  Dice,
  Mince,
  Grate,
  Peel,
  Cut,
  Trim,
  Season,
  Marinate,
  Baste,
  Glaze,
  Garnish,
  Serve,
  Taste,
  Smell,
  Touch,
  Hear,
  See,
  Feel,
  Enjoy,
  Savor,
  Appreciate,
  Love,
  Like,
  Prefer,
  Choose,
  Select,
  Pick,
  Decide,
  Determine,
  Consider,
  Think,
  Believe,
  Know,
  Understand,
  Learn,
  Study,
  Practice,
  Improve,
  Develop,
  Grow,
  Progress,
  Advance,
  Succeed,
  Achieve,
  Accomplish,
  Complete,
  Finish,
  Done,
  Ready,
  Prepare,
  Plan,
  Organize,
  Arrange,
  Schedule,
  Manage,
  Control,
  Direct,
  Lead,
  Guide,
  Help,
  Support,
  Assist,
  Aid,
  Serve,
  Provide,
  Give,
  Offer,
  Share,
  Contribute,
  Participate,
  Engage,
  Involve,
  Include,
  Join,
  Connect,
  Link,
  Relate,
  Associate,
  Combine,
  Merge,
  Unite,
  Integrate,
  Coordinate,
  Collaborate,
  Cooperate,
  Work,
  Function,
  Operate,
  Perform,
  Execute,
  Implement,
  Apply,
  Use,
  Utilize,
  Employ,
  Adopt,
  Embrace,
  Accept,
  Receive,
  Welcome,
  Greet,
  Meet,
  Encounter,
  Discover,
  Find,
  Locate,
  Identify,
  Recognize,
  Distinguish,
  Differentiate,
  Compare,
  Contrast,
  Analyze,
  Examine,
  Inspect,
  Investigate,
  Explore,
  Research,
  Study as StudyIcon,
  Review,
  Evaluate,
  Assess,
  Judge,
  Rate,
  Rank,
  Score,
  Grade,
  Test,
  Try,
  Attempt,
  Effort,
  Endeavor,
  Strive,
  Struggle,
  Fight,
  Battle,
  War,
  Conflict,
  Dispute,
  Argue,
  Debate,
  Discuss,
  Talk,
  Speak,
  Say,
  Tell,
  Communicate,
  Express,
  Convey,
  Transmit,
  Send,
  Deliver,
  Transport,
  Move,
  Transfer,
  Carry,
  Bring,
  Take,
  Get,
  Obtain,
  Acquire,
  Gain,
  Earn,
  Win,
  Lose,
  Fail,
  Succeed,
  Pass,
  Proceed,
  Continue,
  Persist,
  Maintain,
  Keep,
  Hold,
  Retain,
  Preserve,
  Protect,
  Guard,
  Defend,
  Shield as ShieldIcon,
  Shelter,
  Cover,
  Hide,
  Conceal,
  Mask,
  Disguise,
  Camouflage,
  Blend,
  Mix,
  Combine,
  Merge,
  Join,
  Attach,
  Connect,
  Link,
  Bind,
  Tie,
  Fasten,
  Secure,
  Lock,
  Unlock,
  Open,
  Close,
  Shut,
  Seal,
  Block,
  Stop,
  Prevent,
  Avoid,
  Escape,
  Flee,
  Run,
  Walk,
  Step,
  Move,
  Go,
  Come,
  Arrive,
  Reach,
  Approach,
  Leave,
  Depart,
  Exit,
  Enter,
  Return,
  Back,
  Forward,
  Advance,
  Retreat,
  Withdraw,
  Remove,
  Delete,
  Erase,
  Clear,
  Clean,
  Wash,
  Rinse,
  Dry,
  Wet,
  Soak,
  Dip,
  Immerse,
  Submerge,
  Dive,
  Swim,
  Float,
  Sink,
  Fall,
  Drop,
  Rise,
  Lift,
  Raise,
  Lower,
  Push,
  Pull,
  Drag,
  Slide,
  Roll,
  Spin,
  Rotate,
  Turn,
  Twist,
  Bend,
  Fold,
  Wrap,
  Unwrap,
  Pack,
  Unpack,
  Load,
  Unload,
  Fill,
  Empty,
  Pour,
  Spill,
  Drip,
  Leak,
  Flow,
  Stream,
  River,
  Ocean,
  Sea,
  Lake,
  Pond,
  Pool,
  Fountain,
  Well,
  Spring,
  Waterfall,
  Rapids,
  Current,
  Tide,
  Wave,
  Surf,
  Beach,
  Shore,
  Coast,
  Island,
  Peninsula,
  Bay,
  Gulf,
  Strait,
  Channel,
  Port,
  Harbor,
  Dock,
  Pier,
  Wharf,
  Marina,
  Yacht,
  Boat,
  Ship,
  Vessel,
  Cruise,
  Ferry,
  Tugboat,
  Barge,
  Canoe,
  Kayak,
  Raft,
  Surfboard,
  Sailboat,
  Motorboat,
  Speedboat,
  Jetski,
  Submarine,
  Aircraft,
  Airplane,
  Jet,
  Helicopter,
  Drone,
  Balloon,
  Parachute,
  Glider,
  Rocket,
  Spacecraft,
  Satellite,
  Space,
  Universe,
  Galaxy,
  Planet,
  Earth,
  Mars,
  Venus,
  Jupiter,
  Saturn,
  Neptune,
  Uranus,
  Mercury,
  Pluto,
  Asteroid,
  Comet,
  Meteor,
  Meteorite,
  Nebula,
  Constellation,
  Star as StarIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Eclipse,
  Lunar,
  Solar,
  Orbit,
  Gravity,
  Atmosphere,
  Weather,
  Climate,
  Temperature,
  Hot,
  Cold,
  Warm,
  Cool,
  Freeze,
  Melt,
  Evaporate,
  Condense,
  Precipitate,
  Rain,
  Snow,
  Hail,
  Sleet,
  Fog,
  Mist,
  Dew,
  Frost,
  Thunder,
  Lightning,
  Storm,
  Hurricane,
  Tornado,
  Cyclone,
  Typhoon,
  Blizzard,
  Drought,
  Flood,
  Earthquake,
  Volcano,
  Eruption,
  Lava,
  Magma,
  Rock,
  Stone,
  Mineral,
  Crystal,
  Gem,
  Diamond,
  Ruby,
  Emerald,
  Sapphire,
  Topaz,
  Amethyst,
  Quartz,
  Granite,
  Marble,
  Slate,
  Limestone,
  Sandstone,
  Shale,
  Coal,
  Oil,
  Gas,
  Fuel,
  Energy,
  Power,
  Electric,
  Electricity,
  Current,
  Voltage,
  Resistance,
  Conductor,
  Insulator,
  Wire,
  Cable,
  Circuit,
  Switch,
  Button,
  Lever,
  Knob,
  Dial,
  Gauge,
  Meter,
  Measure,
  Scale,
  Balance,
  Weight,
  Mass,
  Volume,
  Capacity,
  Size,
  Length,
  Width,
  Height,
  Depth,
  Thickness,
  Density,
  Pressure,
  Force,
  Motion,
  Speed,
  Velocity,
  Acceleration,
  Momentum,
  Inertia,
  Friction,
  Traction,
  Adhesion,
  Cohesion,
  Tension,
  Compression,
  Stress,
  Strain,
  Elastic,
  Plastic,
  Flexible,
  Rigid,
  Hard,
  Soft,
  Smooth,
  Rough,
  Sharp,
  Dull,
  Pointed,
  Blunt,
  Flat,
  Curved,
  Straight,
  Crooked,
  Bent,
  Twisted,
  Knotted,
  Tangled,
  Loose,
  Tight,
  Slack,
  Taut,
  Stretched,
  Compressed,
  Squeezed,
  Pressed,
  Pushed,
  Pulled,
  Lifted,
  Lowered,
  Raised,
  Dropped,
  Thrown,
  Caught,
  Held,
  Grasped,
  Gripped,
  Squeezed,
  Hugged,
  Embraced,
  Kissed,
  Touched,
  Felt,
  Sensed,
  Perceived,
  Observed,
  Watched,
  Looked,
  Seen,
  Viewed,
  Glimpsed,
  Spotted,
  Noticed,
  Detected,
  Discovered,
  Found,
  Located,
  Positioned,
  Placed,
  Put,
  Set,
  Arranged,
  Organized,
  Sorted,
  Classified,
  Categorized,
  Grouped,
  Collected,
  Gathered,
  Assembled,
  Built,
  Constructed,
  Created,
  Made,
  Formed,
  Shaped,
  Molded,
  Carved,
  Sculpted,
  Painted,
  Drawn,
  Sketched,
  Designed,
  Planned,
  Prepared,
  Organized,
  Arranged,
  Scheduled,
  Timed,
  Counted,
  Numbered,
  Calculated,
  Computed,
  Processed,
  Analyzed,
  Examined,
  Studied,
  Researched,
  Investigated,
  Explored,
  Discovered,
  Found,
  Located,
  Identified,
  Recognized,
  Distinguished,
  Differentiated,
  Compared,
  Contrasted,
  Matched,
  Paired,
  Coupled,
  Joined,
  Connected,
  Linked,
  Related,
  Associated,
  Correlated,
  Corresponded,
  Agreed,
  Disagreed,
  Conflicted,
  Disputed,
  Argued,
  Debated,
  Discussed,
  Talked,
  Spoke,
  Said,
  Told,
  Communicated,
  Expressed,
  Conveyed,
  Transmitted,
  Sent,
  Received,
  Got,
  Obtained,
  Acquired,
  Gained,
  Earned,
  Won,
  Lost,
  Failed,
  Succeeded,
  Achieved,
  Accomplished,
  Completed,
  Finished,
  Done,
  Ready,
  Prepared,
  Organized,
  Arranged,
  Scheduled,
  Planned,
  Designed,
  Created,
  Built,
  Made,
  Formed,
  Shaped,
  Molded,
  Carved,
  Sculpted,
  Painted,
  Drawn,
  Sketched,
  Written,
  Typed,
  Printed,
  Published,
  Shared,
  Distributed,
  Delivered,
  Transported,
  Moved,
  Transferred,
  Carried,
  Brought,
  Taken,
  Removed,
  Deleted,
  Erased,
  Cleared,
  Cleaned,
  Washed,
  Rinsed,
  Dried,
  Wetted,
  Soaked,
  Dipped,
  Immersed,
  Submerged,
  Dove,
  Swam,
  Floated,
  Sank,
  Fell,
  Dropped,
  Rose,
  Lifted,
  Raised,
  Lowered,
  Pushed,
  Pulled,
  Dragged,
  Slid,
  Rolled,
  Spun,
  Rotated,
  Turned,
  Twisted,
  Bent,
  Folded,
  Wrapped,
  Unwrapped,
  Packed,
  Unpacked,
  Loaded,
  Unloaded,
  Filled,
  Emptied,
  Poured,
  Spilled,
  Dripped,
  Leaked,
  Flowed,
  Streamed,
  Rushed,
  Hurried,
  Waited,
  Paused,
  Stopped,
  Started,
  Began,
  Continued,
  Proceeded,
  Advanced,
  Progressed,
  Developed,
  Grew,
  Expanded,
  Increased,
  Decreased,
  Reduced,
  Minimized,
  Maximized,
  Optimized,
  Improved,
  Enhanced,
  Upgraded,
  Updated,
  Refreshed,
  Renewed,
  Restored,
  Repaired,
  Fixed,
  Solved,
  Resolved,
  Answered,
  Responded,
  Replied,
  Reacted,
  Acted,
  Behaved,
  Performed,
  Executed,
  Implemented,
  Applied,
  Used,
  Utilized,
  Employed,
  Operated,
  Functioned,
  Worked,
  Served,
  Helped,
  Assisted,
  Aided,
  Supported,
  Backed,
  Endorsed,
  Approved,
  Accepted,
  Agreed,
  Consented,
  Permitted,
  Allowed,
  Enabled,
  Facilitated,
  Encouraged,
  Motivated,
  Inspired,
  Influenced,
  Affected,
  Impacted,
  Changed,
  Altered,
  Modified,
  Adjusted,
  Adapted,
  Transformed,
  Converted,
  Translated,
  Interpreted,
  Understood,
  Comprehended,
  Grasped,
  Realized,
  Recognized,
  Acknowledged,
  Admitted,
  Confessed,
  Revealed,
  Disclosed,
  Exposed,
  Shown,
  Displayed,
  Presented,
  Demonstrated,
  Illustrated,
  Explained,
  Described,
  Detailed,
  Specified,
  Defined,
  Clarified,
  Simplified,
  Complicated,
  Confused,
  Puzzled,
  Wondered,
  Questioned,
  Doubted,
  Suspected,
  Believed,
  Trusted,
  Relied,
  Depended,
  Counted,
  Expected,
  Anticipated,
  Predicted,
  Forecasted,
  Projected,
  Estimated,
  Guessed,
  Assumed,
  Supposed,
  Imagined,
  Dreamed,
  Fantasized,
  Visualized,
  Envisioned,
  Pictured,
  Saw,
  Looked,
  Watched,
  Observed,
  Noticed,
  Spotted,
  Detected,
  Discovered,
  Found,
  Located,
  Positioned,
  Placed,
  Put,
  Set,
  Arranged,
  Organized,
  Sorted,
  Classified,
  Categorized,
  Grouped,
  Collected,
  Gathered,
  Assembled,
  Built,
  Constructed,
  Created,
  Made,
  Formed,
  Shaped,
  Molded,
  Carved,
  Sculpted,
  Painted,
  Drawn,
  Sketched,
  Designed,
  Planned,
  Prepared,
  Organized,
  Arranged,
  Scheduled,
  Timed,
  Counted,
  Numbered,
  Calculated,
  Computed,
  Processed,
  Analyzed,
  Examined,
  Studied,
  Researched,
  Investigated,
  Explored
} from 'lucide-react';

// Mobile App Component
const MobileApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isExamMode, setIsExamMode] = useState<boolean>(false);
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(false);
  const [micEnabled, setMicEnabled] = useState<boolean>(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [quizProgress, setQuizProgress] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [calculatorResult, setCalculatorResult] = useState<string>('0');
  const [calculatorInput, setCalculatorInput] = useState<string>('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const [batteryLevel, setBatteryLevel] = useState<number>(85);
  const [user, setUser] = useState<any>({
    name: 'John Doe',
    role: 'student',
    profileImage: '/api/placeholder/40/40'
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock quiz data
  const mockQuizzes = [
    {
      id: '1',
      title: 'Mathematics Quiz',
      questions: 20,
      duration: 60,
      subject: 'Mathematics',
      difficulty: 'Medium',
      description: 'Test your mathematical knowledge'
    },
    {
      id: '2',
      title: 'Science Quiz',
      questions: 15,
      duration: 45,
      subject: 'Science',
      difficulty: 'Easy',
      description: 'Basic science concepts'
    },
    {
      id: '3',
      title: 'History Quiz',
      questions: 25,
      duration: 90,
      subject: 'History',
      difficulty: 'Hard',
      description: 'World history examination'
    }
  ];

  const mockQuestion = {
    id: '1',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Rome'],
    type: 'multiple_choice',
    points: 5,
    timeLimit: 30
  };

  // Initialize camera and microphone
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraEnabled(true);
      setMicEnabled(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  }, []);

  // Start exam mode
  const startExamMode = useCallback((quiz: any) => {
    setCurrentQuiz(quiz);
    setIsExamMode(true);
    setActiveTab('exam');
    initializeMedia();
    setQuizProgress(0);
    setSelectedAnswer('');
  }, [initializeMedia]);

  // Calculator operations
  const calculateResult = useCallback((expression: string) => {
    try {
      const result = Function(`"use strict"; return (${expression})`)();
      return result.toString();
    } catch (error) {
      return 'Error';
    }
  }, []);

  const handleCalculatorInput = useCallback((value: string) => {
    if (value === 'C') {
      setCalculatorInput('');
      setCalculatorResult('0');
    } else if (value === '=') {
      const result = calculateResult(calculatorInput);
      setCalculatorResult(result);
      setCalculatorInput(result);
    } else {
      const newInput = calculatorInput + value;
      setCalculatorInput(newInput);
      setCalculatorResult(newInput);
    }
  }, [calculatorInput, calculateResult]);

  // Mock data for dashboard
  const dashboardStats = {
    completedQuizzes: 15,
    averageScore: 85,
    studyTime: 120,
    achievements: 8,
    streak: 7
  };

  const recentActivity = [
    { id: '1', type: 'quiz', title: 'Mathematics Quiz', score: 92, date: '2025-01-08' },
    { id: '2', type: 'study', title: 'Science Study Session', duration: 45, date: '2025-01-07' },
    { id: '3', type: 'achievement', title: 'Perfect Score Badge', date: '2025-01-06' }
  ];

  // Navigation tabs
  const navigationTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'quizzes', label: 'Quizzes', icon: Book },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  // Render different screens based on active tab
  const renderContent = () => {
    if (isExamMode) {
      return (
        <div className="flex flex-col h-full bg-gray-50">
          {/* Exam Header */}
          <div className="bg-white shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Secure Exam Mode</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Timer className="w-4 h-4" />
                <span>28:45</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Camera className={`w-4 h-4 ${cameraEnabled ? 'text-green-600' : 'text-red-600'}`} />
                <Mic className={`w-4 h-4 ${micEnabled ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div className="text-sm text-gray-600">
                {Math.round(quizProgress)}% Complete
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 h-2">
            <div 
              className="bg-blue-600 h-2 transition-all duration-300"
              style={{ width: `${quizProgress}%` }}
            />
          </div>

          {/* Question Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Question 1 of 20</h2>
                  <div className="flex items-center space-x-2">
                    <Flag className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">5 points</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-800 text-lg leading-relaxed">
                    {mockQuestion.question}
                  </p>
                </div>

                <div className="space-y-3">
                  {mockQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAnswer(option)}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        selectedAnswer === option
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          selectedAnswer === option
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedAnswer === option && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                          )}
                        </div>
                        <span className="text-gray-700">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-8">
                  <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800">
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowCalculator(!showCalculator)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      <Calculator className="w-4 h-4" />
                      <span>Calculator</span>
                    </button>
                    
                    <button className="flex items-center space-x-2 px-4 py-2 text-yellow-600 hover:text-yellow-700">
                      <Bookmark className="w-4 h-4" />
                      <span>Flag</span>
                    </button>
                  </div>

                  <button 
                    onClick={() => setQuizProgress(prev => Math.min(prev + 5, 100))}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Camera Preview */}
          <div className="fixed top-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden shadow-lg z-50">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Calculator Modal */}
          {showCalculator && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-80 max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Calculator</h3>
                  <button
                    onClick={() => setShowCalculator(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <div className="bg-gray-100 p-4 rounded-lg text-right font-mono text-xl">
                    {calculatorResult}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='].map((btn) => (
                    <button
                      key={btn}
                      onClick={() => handleCalculatorInput(btn)}
                      className={`p-3 rounded-lg font-medium ${
                        ['C', '±', '%'].includes(btn)
                          ? 'bg-gray-200 text-gray-700'
                          : ['÷', '×', '-', '+', '='].includes(btn)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      } hover:opacity-80 transition-opacity`}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-800">Welcome back, {user.name.split(' ')[0]}</h1>
                    <p className="text-sm text-gray-600">Ready to continue learning?</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Battery className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{batteryLevel}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Wifi className={`w-4 h-4 ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`} />
                    <Signal className="w-4 h-4 text-gray-600" />
                  </div>
                  <Bell className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </div>

            {/* Dashboard Stats */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completed Quizzes</p>
                      <p className="text-2xl font-bold text-gray-800">{dashboardStats.completedQuizzes}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Average Score</p>
                      <p className="text-2xl font-bold text-gray-800">{dashboardStats.averageScore}%</p>
                    </div>
                    <Award className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Study Time</p>
                      <p className="text-2xl font-bold text-gray-800">{dashboardStats.studyTime}h</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Streak</p>
                      <p className="text-2xl font-bold text-gray-800">{dashboardStats.streak} days</p>
                    </div>
                    <Zap className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'quiz' ? 'bg-blue-100' :
                          activity.type === 'study' ? 'bg-green-100' :
                          'bg-yellow-100'
                        }`}>
                          {activity.type === 'quiz' && <Book className="w-4 h-4 text-blue-600" />}
                          {activity.type === 'study' && <FileText className="w-4 h-4 text-green-600" />}
                          {activity.type === 'achievement' && <Award className="w-4 h-4 text-yellow-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                          <p className="text-xs text-gray-500">
                            {activity.type === 'quiz' && `Score: ${activity.score}%`}
                            {activity.type === 'study' && `Duration: ${activity.duration}min`}
                            {activity.type === 'achievement' && 'Achievement unlocked'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{activity.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'quizzes':
        return (
          <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-gray-800">Available Quizzes</h1>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-gray-800">
                    <Search className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-800">
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quiz List */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {mockQuizzes.map((quiz) => (
                  <div key={quiz.id} className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">{quiz.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        quiz.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        quiz.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {quiz.difficulty}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{quiz.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>{quiz.questions} questions</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{quiz.duration} min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Book className="w-4 h-4" />
                          <span>{quiz.subject}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => startExamMode(quiz)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Quiz</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'progress':
        return (
          <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm p-4">
              <h1 className="text-lg font-semibold text-gray-800">Your Progress</h1>
            </div>

            {/* Progress Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-6">
                {/* Overall Progress */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Performance</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Mathematics</span>
                        <span className="text-sm font-medium text-gray-800">85%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Science</span>
                        <span className="text-sm font-medium text-gray-800">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">History</span>
                        <span className="text-sm font-medium text-gray-800">78%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '78%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Scores */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Quiz Scores</h3>
                  
                  <div className="space-y-3">
                    {[
                      { name: 'Mathematics Quiz', score: 92, date: '2025-01-08', trend: 'up' },
                      { name: 'Science Quiz', score: 88, date: '2025-01-07', trend: 'down' },
                      { name: 'History Quiz', score: 95, date: '2025-01-06', trend: 'up' },
                      { name: 'Mathematics Quiz', score: 82, date: '2025-01-05', trend: 'up' }
                    ].map((quiz, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{quiz.name}</p>
                          <p className="text-xs text-gray-500">{quiz.date}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-800">{quiz.score}%</span>
                          {quiz.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievements */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Achievements</h3>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'Perfect Score', icon: '🎯', earned: true },
                      { name: 'Speed Demon', icon: '⚡', earned: true },
                      { name: 'Consistent', icon: '📈', earned: true },
                      { name: 'Scholar', icon: '🎓', earned: false },
                      { name: 'Marathon', icon: '🏃', earned: false },
                      { name: 'Expert', icon: '⭐', earned: false }
                    ].map((achievement, index) => (
                      <div key={index} className={`p-3 rounded-lg text-center ${
                        achievement.earned ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-gray-50 border-2 border-gray-200'
                      }`}>
                        <div className="text-2xl mb-1">{achievement.icon}</div>
                        <p className={`text-xs font-medium ${
                          achievement.earned ? 'text-yellow-800' : 'text-gray-500'
                        }`}>{achievement.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm p-4">
              <h1 className="text-lg font-semibold text-gray-800">Profile</h1>
            </div>

            {/* Profile Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-6">
                {/* User Info */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{user.name}</h2>
                      <p className="text-sm text-gray-600 capitalize">{user.role}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Quizzes</p>
                      <p className="text-lg font-semibold text-gray-800">{dashboardStats.completedQuizzes}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average Score</p>
                      <p className="text-lg font-semibold text-gray-800">{dashboardStats.averageScore}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Study Hours</p>
                      <p className="text-lg font-semibold text-gray-800">{dashboardStats.studyTime}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Achievements</p>
                      <p className="text-lg font-semibold text-gray-800">{dashboardStats.achievements}</p>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Settings</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <span className="text-sm text-gray-800">Notifications</span>
                      </div>
                      <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <Volume2 className="w-5 h-5 text-gray-600" />
                        <span className="text-sm text-gray-800">Sound Effects</span>
                      </div>
                      <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-gray-600" />
                        <span className="text-sm text-gray-800">Privacy Mode</span>
                      </div>
                      <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between py-3 px-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Download className="w-5 h-5" />
                        <span>Download Data</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    <button className="w-full flex items-center justify-between py-3 px-4 text-left text-gray-700 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <HelpCircle className="w-5 h-5" />
                        <span>Help & Support</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    <button className="w-full flex items-center justify-between py-3 px-4 text-left text-red-600 hover:bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto">
      {/* Status Bar */}
      <div className="bg-white px-4 py-2 flex items-center justify-between text-sm border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="font-medium">9:41 AM</span>
          <div className="flex items-center space-x-1">
            <Wifi className={`w-4 h-4 ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`} />
            <Signal className="w-4 h-4 text-gray-600" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">{batteryLevel}%</span>
          <Battery className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      {!isExamMode && (
        <div className="bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex items-center justify-around">
            {navigationTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exam Mode Exit Button */}
      {isExamMode && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => {
              setIsExamMode(false);
              setActiveTab('home');
              setCurrentQuiz(null);
              setCameraEnabled(false);
              setMicEnabled(false);
              if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
              }
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            <X className="w-4 h-4" />
            <span>Exit Exam</span>
          </button>
        </div>
      )}

      {/* Connection Status Toast */}
      {connectionStatus !== 'connected' && (
        <div className="fixed top-16 left-4 right-4 z-50">
          <div className={`p-3 rounded-lg text-white text-sm flex items-center space-x-2 ${
            connectionStatus === 'connecting' ? 'bg-yellow-600' : 'bg-red-600'
          }`}>
            <AlertTriangle className="w-4 h-4" />
            <span>
              {connectionStatus === 'connecting' ? 'Reconnecting...' : 'Connection Lost'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileApp;