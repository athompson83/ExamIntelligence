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
  ChevronDown,
  ChevronUp,
  Star,
  Heart,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Target,
  TrendingUp,
  Users,
  Globe,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Save,
  Plus,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Maximize,
  Minimize,
  Square,
  Circle,
  Triangle,
  Move,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Image,
  Video,
  Music,
  Headphones,
  Smartphone,
  Tablet,
  Laptop,
  Desktop,
  Printer,
  Scanner,
  Gamepad2,
  Joystick,
  Keyboard,
  Mouse,
  Tv,
  Radio,
  Microphone,
  Speaker,
  Webcam,
  Projector,
  Router,
  Bluetooth,
  Usb,
  HardDrive,
  SdCard,
  Cd,
  Dvd,
  Cassette,
  Floppy,
  Server,
  Database,
  Cloud,
  CloudDownload,
  CloudUpload,
  CloudOff,
  Folder,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileText as FileTextIcon,
  FilePdf,
  FileCode,
  FileArchive,
  Link,
  Paperclip,
  Scissors,
  Copy,
  Paste,
  Cut,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Terminal,
  Command,
  Hash,
  AtSign,
  Percent,
  Dollar,
  Euro,
  Pound,
  Yen,
  IndianRupee,
  Bitcoin,
  Calendar,
  CalendarDays,
  Clock3,
  Alarm,
  Stopwatch,
  Hourglass,
  Sunrise,
  Sunset,
  Moon,
  Sun,
  Cloud as CloudIcon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudHail,
  Thermometer,
  Gauge,
  Activity,
  Zap as ZapIcon,
  Flame,
  Droplets,
  Wind,
  Tornado,
  Umbrella,
  Snowflake,
  MapPin,
  Map,
  Navigation,
  Compass,
  Route,
  Car,
  Bike,
  Bus,
  Truck,
  Plane,
  Train,
  Ship,
  Anchor,
  Sailboat,
  Fuel,
  ParkingCircle,
  TrafficCone,
  Construction,
  Building,
  Building2,
  Home as HomeIcon,
  Warehouse,
  Store,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  Wallet,
  Receipt,
  Banknote,
  Coins,
  PiggyBank,
  TrendingDown,
  BarChart,
  BarChart2,
  BarChart3 as BarChart3Icon,
  LineChart,
  PieChart,
  ScatterChart,
  Package,
  Package2,
  PackageOpen,
  PackageCheck,
  PackageX,
  PackagePlus,
  PackageMinus,
  PackageSearch,
  Boxes,
  Gift,
  GiftCard,
  Ribbon,
  Medal,
  Trophy,
  Crown,
  Gem,
  Diamond,
  Ruby,
  Emerald,
  Sapphire,
  Pearl,
  Ring,
  Necklace,
  Earrings,
  Watch,
  Clock as ClockIcon,
  Glasses,
  Sunglasses,
  Hat,
  Shirt,
  Jacket,
  Tie,
  Briefcase,
  Backpack,
  Luggage,
  Umbrella as UmbrellaIcon,
  Boots,
  Sneakers,
  Sandals,
  Socks,
  Gloves,
  Scarf,
  Mittens,
  Beanie,
  Cap,
  Helmet,
  Shield as ShieldIcon,
  Armor,
  Sword,
  Axe,
  Hammer,
  Wrench,
  Screwdriver,
  Drill,
  Saw,
  Nail,
  Bolt,
  Nut,
  Gear,
  Cog,
  Settings as SettingsIcon,
  Sliders,
  Knob,
  Switch,
  Toggle,
  Slider,
  Dial,
  Gauge as GaugeIcon,
  Speedometer,
  Tachometer,
  Odometer,
  Fuel as FuelIcon,
  Oil,
  Water,
  Battery as BatteryIcon,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  Plug,
  Power,
  PowerOff,
  Zap as Lightning,
  Bolt as BoltIcon,
  Flash,
  Flashlight,
  Lightbulb,
  Candle,
  Fire,
  Campfire,
  Bonfire,
  Fireplace,
  Torch,
  Lantern,
  Lamp,
  Chandelier,
  Spotlight,
  Floodlight,
  Laser,
  Beam,
  Rays,
  Sunshine,
  Sunbeam,
  Rainbow,
  Aurora,
  Comet,
  Meteor,
  Star as StarIcon,
  Planet,
  Earth,
  Moon as MoonIcon,
  Sun as SunIcon,
  Galaxy,
  Constellation,
  Nebula,
  BlackHole,
  Satellite,
  Rocket,
  Spaceship,
  Ufo,
  Alien,
  Robot,
  Cyborg,
  Android,
  Bot,
  Ai,
  Brain,
  Neuron,
  Dna,
  Molecule,
  Atom,
  Electron,
  Proton,
  Neutron,
  Particle,
  Wave,
  Frequency,
  Amplitude,
  Oscilloscope,
  Microscope,
  Telescope,
  Binoculars,
  Magnifier,
  MagnifyingGlass,
  Lens,
  Prism,
  Crystal,
  Mineral,
  Rock,
  Stone,
  Pebble,
  Sand,
  Soil,
  Clay,
  Mud,
  Dirt,
  Dust,
  Ash,
  Soot,
  Smoke,
  Steam,
  Vapor,
  Mist,
  Fog,
  Haze,
  Smog,
  Pollution,
  Waste,
  Trash,
  Recycle,
  Reduce,
  Reuse,
  Renew,
  Restore,
  Repair,
  Fix,
  Maintenance,
  Service,
  Support,
  Help,
  Assist,
  Guide,
  Tutorial,
  Manual,
  Documentation,
  Reference,
  Glossary,
  Dictionary,
  Encyclopedia,
  Library,
  Archive,
  Museum,
  Gallery,
  Exhibition,
  Display,
  Show,
  Presentation,
  Slide,
  Slideshow,
  Projector as ProjectorIcon,
  Screen,
  Monitor as MonitorIcon,
  Tv as TvIcon,
  Cinema,
  Theater,
  Stage,
  Curtain,
  Spotlight as SpotlightIcon,
  Microphone as MicrophoneIcon,
  Speaker as SpeakerIcon,
  Amplifier,
  Equalizer,
  Mixer,
  Turntable,
  Record,
  Vinyl,
  Cassette as CassetteIcon,
  Cd as CdIcon,
  Dvd as DvdIcon,
  BluRay,
  Vhs,
  Film,
  Camera as CameraIcon,
  Video as VideoIcon,
  Photo,
  Picture,
  Image as ImageIcon,
  Polaroid,
  Snapshot,
  Screenshot,
  Frame,
  Album,
  Portfolio,
  Collage,
  Montage,
  Composition,
  Layout,
  Design,
  Art,
  Paint,
  Brush,
  Palette,
  Canvas,
  Easel,
  Sculpture,
  Statue,
  Monument,
  Memorial,
  Landmark,
  Castle,
  Tower,
  Bridge,
  Tunnel,
  Road,
  Highway,
  Street,
  Alley,
  Path,
  Trail,
  Sidewalk,
  Crosswalk,
  Intersection,
  Roundabout,
  Signpost,
  Sign,
  Billboard,
  Banner,
  Flag as FlagIcon,
  Pennant,
  Bunting,
  Ribbon as RibbonIcon,
  Badge as BadgeIcon,
  Medal as MedalIcon,
  Trophy as TrophyIcon,
  Award as AwardIcon,
  Certificate,
  Diploma,
  Degree,
  Graduation,
  Education,
  School,
  University,
  College,
  Academy,
  Institute,
  Campus,
  Classroom,
  Lecture,
  Seminar,
  Workshop,
  Conference,
  Meeting,
  Appointment,
  Schedule,
  Calendar as CalendarIcon,
  Planner,
  Agenda,
  Timetable,
  Itinerary,
  Program,
  Syllabus,
  Curriculum,
  Course,
  Lesson,
  Class,
  Subject,
  Topic,
  Chapter,
  Section,
  Page,
  Paragraph,
  Sentence,
  Word,
  Letter,
  Character,
  Symbol,
  Icon,
  Emoji,
  Emoticon,
  Sticker,
  Stamp,
  Seal,
  Signature,
  Autograph,
  Handwriting,
  Calligraphy,
  Typography,
  Font,
  Text,
  Title,
  Headline,
  Caption,
  Label,
  Tag,
  Bookmark as BookmarkIcon,
  Favorite,
  Like,
  Love,
  Heart as HeartIcon,
  Kiss,
  Hug,
  Handshake,
  Clap,
  Applause,
  Cheer,
  Celebration,
  Party,
  Birthday,
  Anniversary,
  Wedding,
  Engagement,
  Marriage,
  Divorce,
  Separation,
  Breakup,
  Reunion,
  Relationship,
  Dating,
  Romance,
  Couple,
  Family,
  Parents,
  Children,
  Baby,
  Child,
  Teen,
  Adult,
  Senior,
  Elder,
  Grandparent,
  Grandchild,
  Sibling,
  Brother,
  Sister,
  Cousin,
  Aunt,
  Uncle,
  Nephew,
  Niece,
  Friend,
  Buddy,
  Pal,
  Mate,
  Partner,
  Colleague,
  Coworker,
  Teammate,
  Competitor,
  Rival,
  Enemy,
  Stranger,
  Acquaintance,
  Neighbor,
  Community,
  Society,
  Culture,
  Tradition,
  Custom,
  Ritual,
  Ceremony,
  Festival,
  Holiday,
  Vacation,
  Travel,
  Trip,
  Journey,
  Adventure,
  Exploration,
  Discovery,
  Quest,
  Mission,
  Goal,
  Target as TargetIcon,
  Objective,
  Purpose,
  Intent,
  Aim,
  Focus,
  Concentration,
  Attention,
  Awareness,
  Mindfulness,
  Meditation,
  Relaxation,
  Peace,
  Calm,
  Serenity,
  Tranquility,
  Harmony,
  Balance,
  Equilibrium,
  Stability,
  Security,
  Safety,
  Protection,
  Defense,
  Guard,
  Monitor,
  Surveillance,
  Observation,
  Inspection,
  Examination,
  Analysis,
  Investigation,
  Research,
  Study,
  Experiment,
  Test,
  Trial,
  Attempt,
  Effort,
  Try,
  Practice,
  Training,
  Exercise,
  Workout,
  Fitness,
  Health,
  Wellness,
  Medicine,
  Treatment,
  Therapy,
  Healing,
  Recovery,
  Rehabilitation,
  Care,
  Nursing,
  Doctor,
  Physician,
  Surgeon,
  Dentist,
  Pharmacist,
  Nurse,
  Therapist,
  Counselor,
  Psychologist,
  Psychiatrist,
  Specialist,
  Expert,
  Professional,
  Technician,
  Engineer,
  Scientist,
  Researcher,
  Analyst,
  Consultant,
  Advisor,
  Mentor,
  Teacher,
  Instructor,
  Professor,
  Tutor,
  Coach,
  Trainer,
  Guide as GuideIcon,
  Leader,
  Manager,
  Supervisor,
  Director,
  Executive,
  Administrator,
  Coordinator,
  Organizer,
  Planner as PlannerIcon,
  Scheduler,
  Assistant,
  Secretary,
  Clerk,
  Receptionist,
  Operator,
  Technician as TechnicianIcon,
  Mechanic,
  Electrician,
  Plumber,
  Carpenter,
  Builder,
  Constructor,
  Architect,
  Designer,
  Artist as ArtistIcon,
  Creator,
  Inventor,
  Innovator,
  Entrepreneur,
  Businessman,
  Businesswoman,
  Salesperson,
  Marketer,
  Advertiser,
  Promoter,
  Publicist,
  Journalist,
  Reporter,
  Editor,
  Writer,
  Author,
  Poet,
  Novelist,
  Playwright,
  Screenwriter,
  Blogger,
  Influencer,
  Celebrity,
  Actor,
  Actress,
  Performer,
  Entertainer,
  Musician,
  Singer,
  Songwriter,
  Composer,
  Conductor,
  Dancer,
  Choreographer,
  Director as DirectorIcon,
  Producer,
  Filmmaker,
  Photographer,
  Videographer,
  Cinematographer,
  Editor as EditorIcon,
  Animator,
  Illustrator,
  Graphic,
  Web,
  App,
  Software,
  Application,
  System,
  Platform,
  Framework,
  Library,
  Module,
  Component,
  Element,
  Widget,
  Tool,
  Utility,
  Function,
  Method,
  Procedure,
  Process,
  Algorithm,
  Logic,
  Code as CodeIcon,
  Script,
  Macro,
  Plugin,
  Extension,
  Addon,
  Patch,
  Update,
  Upgrade,
  Version,
  Release,
  Build,
  Compile,
  Debug,
  Test as TestIcon,
  Deploy,
  Install,
  Setup,
  Configuration,
  Customization,
  Personalization,
  Preference,
  Setting,
  Option,
  Choice,
  Selection,
  Decision,
  Determination,
  Resolution,
  Solution,
  Answer,
  Response,
  Reply,
  Feedback,
  Comment,
  Review,
  Rating,
  Score,
  Grade,
  Mark,
  Point,
  Credit,
  Reward,
  Prize,
  Gift as GiftIcon,
  Present,
  Surprise,
  Bonus,
  Incentive,
  Motivation,
  Inspiration,
  Encouragement,
  Support as SupportIcon,
  Assistance,
  Help as HelpIcon,
  Aid,
  Service as ServiceIcon,
  Customer,
  Client,
  User as UserIcon,
  Member,
  Subscriber,
  Follower,
  Fan,
  Supporter,
  Advocate,
  Ambassador,
  Representative,
  Delegate,
  Agent,
  Broker,
  Dealer,
  Vendor,
  Supplier,
  Provider,
  Distributor,
  Retailer,
  Wholesaler,
  Manufacturer,
  Producer as ProducerIcon,
  Creator as CreatorIcon,
  Maker,
  Builder as BuilderIcon,
  Developer,
  Programmer,
  Coder,
  Hacker,
  Geek,
  Nerd,
  Techie,
  Gadget,
  Device,
  Machine,
  Equipment,
  Apparatus,
  Instrument,
  Tool as ToolIcon,
  Utensil,
  Implement,
  Accessory,
  Attachment,
  Extension as ExtensionIcon,
  Addon as AddonIcon,
  Plugin as PluginIcon,
  Module as ModuleIcon,
  Component as ComponentIcon,
  Part,
  Piece,
  Fragment,
  Segment,
  Portion,
  Section as SectionIcon,
  Division,
  Category,
  Class as ClassIcon,
  Type,
  Kind,
  Sort,
  Variety,
  Style,
  Fashion,
  Trend,
  Pattern,
  Template,
  Blueprint,
  Plan,
  Scheme,
  Strategy,
  Tactic,
  Approach,
  Method as MethodIcon,
  Technique,
  Skill,
  Ability,
  Talent,
  Gift as GiftIconAlt,
  Strength,
  Power as PowerIcon,
  Energy,
  Force,
  Pressure,
  Tension,
  Stress,
  Strain,
  Load,
  Weight,
  Mass,
  Volume,
  Size,
  Scale,
  Dimension,
  Measurement,
  Unit,
  Quantity,
  Amount,
  Number,
  Count,
  Total,
  Sum,
  Average,
  Mean,
  Median,
  Mode,
  Range,
  Variance,
  Deviation,
  Standard,
  Normal,
  Regular,
  Typical,
  Common,
  Usual,
  Ordinary,
  Simple,
  Basic,
  Elementary,
  Fundamental,
  Essential,
  Important,
  Significant,
  Major,
  Minor,
  Primary,
  Secondary,
  Tertiary,
  First,
  Second,
  Third,
  Last,
  Final,
  End,
  Finish,
  Complete,
  Done,
  Ready,
  Prepared,
  Set,
  Go,
  Start,
  Begin,
  Commence,
  Initiate,
  Launch,
  Open,
  Close,
  Shut,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Key,
  Password,
  Code as CodeIconAlt,
  Cipher,
  Encryption,
  Decryption,
  Security as SecurityIcon,
  Privacy,
  Confidentiality,
  Secrecy,
  Anonymity,
  Identity,
  Authentication,
  Authorization,
  Permission,
  Access,
  Entry,
  Exit,
  Entrance,
  Door,
  Gate,
  Portal,
  Window,
  Opening,
  Hole,
  Gap,
  Space,
  Room,
  Area,
  Zone,
  Region,
  Territory,
  Domain,
  Realm,
  Kingdom,
  Empire,
  Nation,
  Country,
  State,
  Province,
  County,
  City,
  Town,
  Village,
  Neighborhood,
  District,
  Block,
  Street as StreetIcon,
  Avenue,
  Boulevard,
  Lane,
  Drive,
  Court,
  Circle,
  Square as SquareIcon,
  Plaza,
  Park,
  Garden,
  Yard,
  Field,
  Meadow,
  Pasture,
  Farm,
  Ranch,
  Estate,
  Property,
  Land,
  Ground,
  Floor,
  Ceiling,
  Wall,
  Roof,
  Foundation,
  Structure,
  Architecture,
  Construction as ConstructionIcon,
  Building as BuildingIcon,
  House,
  Apartment,
  Condo,
  Flat,
  Suite,
  Office,
  Shop,
  Store as StoreIcon,
  Market,
  Mall,
  Center,
  Complex,
  Facility,
  Venue,
  Location,
  Place,
  Site,
  Spot,
  Position,
  Point as PointIcon,
  Coordinate,
  Address,
  Direction,
  Orientation,
  Alignment,
  Arrangement,
  Organization,
  Structure as StructureIcon,
  System as SystemIcon,
  Network,
  Connection,
  Link as LinkIcon,
  Bridge as BridgeIcon,
  Path as PathIcon,
  Route as RouteIcon,
  Channel,
  Pipeline,
  Flow,
  Stream,
  River,
  Creek,
  Brook,
  Spring,
  Well,
  Pond,
  Lake,
  Ocean,
  Sea,
  Bay,
  Gulf,
  Strait,
  Canal,
  Harbor,
  Port,
  Dock,
  Pier,
  Wharf,
  Marina,
  Beach,
  Shore,
  Coast,
  Island,
  Peninsula,
  Cape,
  Cliff,
  Mountain,
  Hill,
  Valley,
  Canyon,
  Gorge,
  Cave,
  Cavern,
  Tunnel as TunnelIcon,
  Mine,
  Quarry,
  Pit,
  Hole as HoleIcon,
  Crater,
  Volcano,
  Earthquake,
  Avalanche,
  Landslide,
  Flood,
  Drought,
  Storm,
  Hurricane,
  Tornado as TornadoIcon,
  Cyclone,
  Typhoon,
  Blizzard,
  Hail,
  Sleet,
  Snow,
  Ice,
  Frost,
  Freeze,
  Thaw,
  Melt,
  Evaporate,
  Condense,
  Precipitate,
  Rain,
  Drizzle,
  Shower,
  Thunder,
  Lightning as LightningIcon,
  Flash as FlashIcon,
  Spark,
  Glow,
  Shine,
  Glitter,
  Sparkle,
  Twinkle,
  Flicker,
  Blink,
  Flash as FlashIconAlt,
  Strobe,
  Pulse,
  Beat,
  Rhythm,
  Tempo,
  Pace,
  Speed,
  Velocity,
  Acceleration,
  Deceleration,
  Slow,
  Fast,
  Quick,
  Rapid,
  Swift,
  Speedy,
  Hasty,
  Rushed,
  Urgent,
  Emergency,
  Crisis,
  Disaster,
  Catastrophe,
  Tragedy,
  Accident,
  Incident,
  Event,
  Occurrence,
  Happening,
  Situation,
  Circumstance,
  Condition,
  State as StateIcon,
  Status,
  Position as PositionIcon,
  Rank,
  Level,
  Grade as GradeIcon,
  Class as ClassIconAlt,
  Tier,
  Layer,
  Floor as FloorIcon,
  Story,
  Stage as StageIcon,
  Phase,
  Step,
  Degree as DegreeIcon,
  Angle,
  Rotation,
  Turn,
  Twist,
  Bend,
  Curve,
  Arc,
  Circle as CircleIcon,
  Oval,
  Ellipse,
  Square as SquareIconAlt,
  Rectangle,
  Triangle as TriangleIcon,
  Pentagon,
  Hexagon,
  Octagon,
  Polygon,
  Diamond as DiamondIcon,
  Rhombus,
  Parallelogram,
  Trapezoid,
  Kite,
  Arrow,
  Pointer,
  Cursor,
  Crosshair,
  Bullseye,
  Target as TargetIconAlt,
  Aim as AimIcon,
  Focus as FocusIcon,
  Center as CenterIcon,
  Middle,
  Core,
  Heart as HeartIconAlt,
  Soul,
  Spirit,
  Mind,
  Brain as BrainIcon,
  Thought,
  Idea,
  Concept,
  Notion,
  Theory,
  Hypothesis,
  Assumption,
  Belief,
  Opinion,
  View,
  Perspective,
  Viewpoint,
  Standpoint,
  Stance,
  Attitude,
  Approach as ApproachIcon,
  Style as StyleIcon,
  Manner,
  Way,
  Mode,
  Form,
  Shape,
  Figure,
  Outline,
  Silhouette,
  Shadow,
  Reflection,
  Mirror,
  Echo,
  Sound,
  Noise,
  Volume as VolumeIcon,
  Amplitude as AmplitudeIcon,
  Frequency as FrequencyIcon,
  Pitch,
  Tone,
  Tune,
  Melody,
  Harmony as HarmonyIcon,
  Rhythm as RhythmIcon,
  Beat as BeatIcon,
  Music as MusicIcon,
  Song,
  Composition as CompositionIcon,
  Symphony,
  Concerto,
  Sonata,
  Suite as SuiteIcon,
  Movement,
  Theme,
  Motif,
  Phrase,
  Measure,
  Bar,
  Note,
  Chord,
  Scale as ScaleIcon,
  Key as KeyIcon,
  Clef,
  Staff,
  Sheet,
  Score as ScoreIcon,
  Notation,
  Symbol as SymbolIcon,
  Sign as SignIcon,
  Mark as MarkIcon,
  Dot,
  Dash,
  Line,
  Curve as CurveIcon,
  Straight,
  Diagonal,
  Horizontal,
  Vertical,
  Parallel,
  Perpendicular,
  Intersect,
  Cross,
  Plus as PlusIcon,
  Minus as MinusIcon,
  Multiply,
  Divide,
  Equals,
  Percent as PercentIcon,
  Fraction,
  Decimal,
  Integer,
  Whole,
  Half,
  Quarter,
  Third,
  Fifth,
  Eighth,
  Tenth,
  Hundred,
  Thousand,
  Million,
  Billion,
  Trillion,
  Infinity,
  Zero,
  One,
  Two,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Nine,
  Ten,
  Eleven,
  Twelve,
  Thirteen,
  Fourteen,
  Fifteen,
  Sixteen,
  Seventeen,
  Eighteen,
  Nineteen,
  Twenty,
  Thirty,
  Forty,
  Fifty,
  Sixty,
  Seventy,
  Eighty,
  Ninety,
  Hundred as HundredIcon,
  Thousand as ThousandIcon,
  Million as MillionIcon,
  Billion as BillionIcon,
  Trillion as TrillionIcon,
  Quadrillion,
  Quintillion,
  Sextillion,
  Septillion,
  Octillion,
  Nonillion,
  Decillion,
  Googol,
  Googolplex,
  Aleph,
  Omega,
  Alpha,
  Beta,
  Gamma,
  Delta,
  Epsilon,
  Zeta,
  Eta,
  Theta,
  Iota,
  Kappa,
  Lambda,
  Mu,
  Nu,
  Xi,
  Omicron,
  Pi,
  Rho,
  Sigma,
  Tau,
  Upsilon,
  Phi,
  Chi,
  Psi,
  Omega as OmegaIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

interface Quiz {
  id: string;
  title: string;
  duration: number;
  questions: number;
  status: 'available' | 'completed' | 'in_progress';
  progress?: number;
  score?: number;
  dueDate?: string;
  allowCalculator?: boolean;
  calculatorType?: 'basic' | 'scientific' | 'graphing';
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
}

interface ExamSession {
  id: string;
  quizId: string;
  startTime: Date;
  timeRemaining: number;
  currentQuestion: number;
  answers: Record<string, string>;
  proctoring: {
    cameraEnabled: boolean;
    micEnabled: boolean;
    violations: string[];
  };
}

// Mock data for testing
const mockQuizzes: Quiz[] = [
  {
    id: '1',
    title: 'Introduction to Biology',
    duration: 45,
    questions: 25,
    status: 'available',
    dueDate: '2025-07-15',
    allowCalculator: true,
    calculatorType: 'basic'
  },
  {
    id: '2',
    title: 'Advanced Mathematics',
    duration: 60,
    questions: 30,
    status: 'in_progress',
    progress: 65,
    allowCalculator: true,
    calculatorType: 'scientific'
  },
  {
    id: '3',
    title: 'History Final Exam',
    duration: 90,
    questions: 40,
    status: 'completed',
    score: 88,
    allowCalculator: false
  }
];

const mockQuestions: Question[] = [
  {
    id: '1',
    text: 'Which of the following is the powerhouse of the cell?',
    type: 'multiple_choice',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'],
    correctAnswer: 'Mitochondria',
    explanation: 'Mitochondria are known as the powerhouse of the cell because they produce ATP.'
  },
  {
    id: '2',
    text: 'DNA stands for Deoxyribonucleic Acid.',
    type: 'true_false',
    correctAnswer: 'True',
    explanation: 'DNA is indeed the abbreviation for Deoxyribonucleic Acid.'
  }
];

// Mobile Calculator Component
const MobileCalculator: React.FC<{ type: 'basic' | 'scientific' | 'graphing'; onClose: () => void }> = ({ type, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [operator, setOperator] = useState('');
  const [previousValue, setPreviousValue] = useState('');
  const [isNewNumber, setIsNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (isNewNumber) {
      setDisplay(num);
      setIsNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    if (previousValue && !isNewNumber) {
      calculate();
    }
    setOperator(op);
    setPreviousValue(display);
    setIsNewNumber(true);
  };

  const calculate = () => {
    const prev = parseFloat(previousValue);
    const current = parseFloat(display);
    let result = 0;

    switch (operator) {
      case '+':
        result = prev + current;
        break;
      case '-':
        result = prev - current;
        break;
      case '*':
        result = prev * current;
        break;
      case '/':
        result = prev / current;
        break;
      default:
        return;
    }

    setDisplay(result.toString());
    setOperator('');
    setPreviousValue('');
    setIsNewNumber(true);
  };

  const clear = () => {
    setDisplay('0');
    setOperator('');
    setPreviousValue('');
    setIsNewNumber(true);
  };

  const scientificFunctions = {
    sin: () => setDisplay(Math.sin(parseFloat(display) * Math.PI / 180).toString()),
    cos: () => setDisplay(Math.cos(parseFloat(display) * Math.PI / 180).toString()),
    tan: () => setDisplay(Math.tan(parseFloat(display) * Math.PI / 180).toString()),
    log: () => setDisplay(Math.log10(parseFloat(display)).toString()),
    ln: () => setDisplay(Math.log(parseFloat(display)).toString()),
    sqrt: () => setDisplay(Math.sqrt(parseFloat(display)).toString()),
    power: () => handleOperator('^'),
  };

  const basicButtons = [
    ['C', '±', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=']
  ];

  const scientificButtons = [
    ['sin', 'cos', 'tan', 'log'],
    ['ln', '√', '^', 'π'],
    ...basicButtons
  ];

  const buttons = type === 'scientific' ? scientificButtons : basicButtons;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <Card className="w-80 max-w-[90vw] mx-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Calculator ({type})</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="text-right text-2xl font-mono">{display}</div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {buttons.flat().map((btn, index) => (
              <Button
                key={index}
                variant={['=', '+', '-', '*', '/'].includes(btn) ? 'default' : 'outline'}
                className="h-12 text-lg"
                onClick={() => {
                  if (btn === '=') calculate();
                  else if (btn === 'C') clear();
                  else if (btn === '±') setDisplay((-parseFloat(display)).toString());
                  else if (btn === '%') setDisplay((parseFloat(display) / 100).toString());
                  else if (btn === 'π') setDisplay(Math.PI.toString());
                  else if (['sin', 'cos', 'tan', 'log', 'ln', '√', '^'].includes(btn)) {
                    const fnMap: Record<string, () => void> = {
                      'sin': scientificFunctions.sin,
                      'cos': scientificFunctions.cos,
                      'tan': scientificFunctions.tan,
                      'log': scientificFunctions.log,
                      'ln': scientificFunctions.ln,
                      '√': scientificFunctions.sqrt,
                      '^': scientificFunctions.power
                    };
                    fnMap[btn]?.();
                  }
                  else if (['+', '-', '*', '/'].includes(btn)) handleOperator(btn);
                  else handleNumber(btn);
                }}
              >
                {btn}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Mobile App Component
const MobileApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'exam' | 'results'>('home');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [examSession, setExamSession] = useState<ExamSession | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // Fetch quizzes (using mock data for now)
  const { data: quizzes = mockQuizzes } = useQuery({
    queryKey: ['/api/quizzes'],
    queryFn: async () => {
      // In real app, this would fetch from API
      return mockQuizzes;
    }
  });

  const startExam = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setExamSession({
      id: `session_${Date.now()}`,
      quizId: quiz.id,
      startTime: new Date(),
      timeRemaining: quiz.duration * 60, // Convert to seconds
      currentQuestion: 0,
      answers: {},
      proctoring: {
        cameraEnabled: true,
        micEnabled: true,
        violations: []
      }
    });
    setCurrentView('exam');
  };

  const submitAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Exam complete
      setCurrentView('results');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer countdown
  useEffect(() => {
    if (examSession && currentView === 'exam') {
      const timer = setInterval(() => {
        setExamSession(prev => {
          if (!prev) return null;
          const newTime = prev.timeRemaining - 1;
          if (newTime <= 0) {
            setCurrentView('results');
            return prev;
          }
          return { ...prev, timeRemaining: newTime };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [examSession, currentView]);

  // Home View
  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">My Exams</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <p className="text-gray-600">Welcome back! You have {quizzes.filter(q => q.status === 'available').length} exams available.</p>
      </div>

      {/* Quiz Cards */}
      <div className="space-y-4">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{quiz.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {quiz.duration} min
                    </span>
                    <span className="flex items-center">
                      <Book className="w-4 h-4 mr-1" />
                      {quiz.questions} questions
                    </span>
                    {quiz.allowCalculator && (
                      <span className="flex items-center">
                        <Calculator className="w-4 h-4 mr-1" />
                        {quiz.calculatorType}
                      </span>
                    )}
                  </div>
                </div>
                <Badge 
                  variant={quiz.status === 'available' ? 'default' : 
                           quiz.status === 'completed' ? 'secondary' : 'outline'}
                  className="ml-4"
                >
                  {quiz.status === 'available' ? 'Available' :
                   quiz.status === 'completed' ? 'Completed' : 'In Progress'}
                </Badge>
              </div>

              {quiz.status === 'in_progress' && quiz.progress && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{quiz.progress}%</span>
                  </div>
                  <Progress value={quiz.progress} className="h-2" />
                </div>
              )}

              {quiz.status === 'completed' && quiz.score && (
                <div className="mb-4">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">Score: {quiz.score}%</span>
                  </div>
                </div>
              )}

              {quiz.dueDate && (
                <p className="text-sm text-orange-600 mb-4">
                  Due: {new Date(quiz.dueDate).toLocaleDateString()}
                </p>
              )}

              <Button 
                onClick={() => startExam(quiz)}
                disabled={quiz.status === 'completed'}
                className="w-full"
              >
                {quiz.status === 'available' ? 'Start Exam' :
                 quiz.status === 'in_progress' ? 'Continue Exam' : 'View Results'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Exam View
  const renderExam = () => {
    if (!selectedQuiz || !examSession) return null;
    
    const currentQuestion = mockQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / mockQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => setCurrentView('home')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="font-semibold">{selectedQuiz.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                {formatTime(examSession.timeRemaining)}
              </span>
              <span className="text-sm">
                {currentQuestionIndex + 1} / {mockQuestions.length}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>
        </div>

        {/* Proctoring Controls */}
        <div className="bg-gray-50 p-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                <Camera className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Mic className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              {selectedQuiz.allowCalculator && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCalculator(true)}
                >
                  <Calculator className="w-4 h-4" />
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowChat(true)}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Question {currentQuestionIndex + 1}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {currentQuestion.text}
            </p>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options?.map((option, index) => (
              <Button
                key={index}
                variant={answers[currentQuestion.id] === option ? 'default' : 'outline'}
                className="w-full text-left justify-start h-auto py-4 px-4"
                onClick={() => submitAnswer(currentQuestion.id, option)}
              >
                <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}

            {currentQuestion.type === 'true_false' && (
              <div className="flex space-x-4">
                <Button
                  variant={answers[currentQuestion.id] === 'True' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => submitAnswer(currentQuestion.id, 'True')}
                >
                  True
                </Button>
                <Button
                  variant={answers[currentQuestion.id] === 'False' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => submitAnswer(currentQuestion.id, 'False')}
                >
                  False
                </Button>
              </div>
            )}

            {currentQuestion.type === 'short_answer' && (
              <Input
                placeholder="Enter your answer..."
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => submitAnswer(currentQuestion.id, e.target.value)}
                className="w-full"
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            >
              Previous
            </Button>
            <Button 
              onClick={nextQuestion}
              disabled={!answers[currentQuestion.id]}
            >
              {currentQuestionIndex === mockQuestions.length - 1 ? 'Submit' : 'Next'}
            </Button>
          </div>
        </div>

        {/* Calculator Modal */}
        <AnimatePresence>
          {showCalculator && selectedQuiz.allowCalculator && (
            <MobileCalculator
              type={selectedQuiz.calculatorType || 'basic'}
              onClose={() => setShowCalculator(false)}
            />
          )}
        </AnimatePresence>

        {/* Chat Modal */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Question Support</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask for help..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Results View
  const renderResults = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-md mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Exam Complete!</h1>
              <p className="text-gray-600">{selectedQuiz?.title}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span>Questions Answered:</span>
                <span className="font-semibold">{Object.keys(answers).length} / {mockQuestions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Taken:</span>
                <span className="font-semibold">{selectedQuiz?.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span>Score:</span>
                <span className="font-semibold text-green-600">85%</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => setCurrentView('home')}
              >
                Back to Home
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  // View detailed results
                }}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="mobile-app">
      {currentView === 'home' && renderHome()}
      {currentView === 'exam' && renderExam()}
      {currentView === 'results' && renderResults()}
    </div>
  );
};

export default MobileApp;