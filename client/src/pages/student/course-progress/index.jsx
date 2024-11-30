import StudentViewCommonHeader from "@/components/student-view/header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoPlayer from "@/components/video-player";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import {
  getCurrentCourseProgressService,
  markLectureAsViewedService,
  resetCourseProgressService,
} from "@/services";
import { Check, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useNavigate, useParams } from "react-router-dom";

function StudentViewCourseProgressPage() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const { studentCurrentCourseProgress, setStudentCurrentCourseProgress } =
    useContext(StudentContext);
  const [lockCourse, setLockCourse] = useState(false);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [showCourseCompleteDialog, setShowCourseCompleteDialog] =
    useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSideBarOpen, setIsSideBarOpen] = useState(true);
  const { id } = useParams();

  async function fetchCurrentCourseProgress() {
    const response = await getCurrentCourseProgressService(auth?.user?._id, id);
    if (response?.success) {
      if (!response?.data?.isPurchased) {
        setLockCourse(true);
      } else {
        setStudentCurrentCourseProgress({
          courseDetails: response?.data?.courseDetails,
          progress: response?.data?.progress,
        });

        if (response?.data?.completed) {
          setCurrentLecture(response?.data?.courseDetails?.curriculum[0]);
          setShowCourseCompleteDialog(true);
          setShowConfetti(true);

          return;
        }

        if (response?.data?.progress?.length === 0) {
          setCurrentLecture(response?.data?.courseDetails?.curriculum[0]);
        } else {
          const lastIndexOfViewedAsTrue = response?.data?.progress.reduceRight(
            (acc, obj, index) => {
              return acc === -1 && obj.viewed ? index : acc;
            },
            -1
          );

          setCurrentLecture(
            response?.data?.courseDetails?.curriculum[
              lastIndexOfViewedAsTrue + 1
            ]
          );
        }
      }
    }
  }

  async function updateCourseProgress() {
    if (currentLecture) {
      const response = await markLectureAsViewedService(
        auth?.user?._id,
        studentCurrentCourseProgress?.courseDetails?._id,
        currentLecture._id
      );

      if (response?.success) {
        fetchCurrentCourseProgress();
      }
    }
  }

  async function handleRewatchCourse() {
    const response = await resetCourseProgressService(
      auth?.user?._id,
      studentCurrentCourseProgress?.courseDetails?._id
    );

    if (response?.success) {
      setCurrentLecture(null);
      setShowConfetti(false);
      setShowCourseCompleteDialog(false);
      fetchCurrentCourseProgress();
    }
  }

  useEffect(() => {
    fetchCurrentCourseProgress();
  }, [id]);

  useEffect(() => {
    if (currentLecture?.progressValue === 1) updateCourseProgress();
  }, [currentLecture]);

  useEffect(() => {
    if (showConfetti) setTimeout(() => setShowConfetti(false), 15000);
  }, [showConfetti]);

  return (
    <>
      <StudentViewCommonHeader />
      <div className="flex flex-col h-screen bg-[#1c1d1f] text-white">
        {showConfetti && <Confetti />}

        <header className="flex items-center justify-between p-4 bg-[#121212] shadow-md">
          <div className="flex items-center space-x-4 justify-center">
            <Button
              onClick={() => navigate("/student-courses")}
              className="flex items-center gap-2 bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5" />
              Back to My Courses
            </Button>
            <h1 className="text-xl font-semibold">
              {studentCurrentCourseProgress?.courseDetails?.title}
            </h1>
          </div>
          <Button
            onClick={() => setIsSideBarOpen(!isSideBarOpen)}
            className="bg-red-300 hover:bg-red-500 p-2 rounded-full"
          >
            {isSideBarOpen ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </header>

        <main className="flex flex-1 overflow-hidden">
          <section
            className={`flex-1 transition-all duration-300 ${
              isSideBarOpen ? "mr-[400px]" : "mr-0"
            }`}
          >
            <VideoPlayer
              url={currentLecture?.videoUrl}
              progressData={currentLecture}
            />
            <div className="p-6 bg-[#1c1d1f]">
              <h2 className="text-2xl font-bold">{currentLecture?.title}</h2>
            </div>
          </section>

          <aside
            className={`fixed top-[150px] right-0 bottom-0 w-[400px] bg-[#1c1d1f] border-l border-gray-700 transition-transform duration-300 ${
              isSideBarOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <Tabs >
              <TabsList className="flex border-b border-gray-600">
                <TabsTrigger
                  value="content"
                  className="flex-1 p-3 text-center cursor-pointer hover:bg-gray-700 focus:outline-none transition-colors"
                >
                  Course Content
                </TabsTrigger>
                <TabsTrigger
                  value="overview"
                  className="flex-1 p-3 text-center cursor-pointer hover:bg-gray-700 focus:outline-none transition-colors"
                >
                  Overview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="overflow-y-auto p-4">
                {studentCurrentCourseProgress?.courseDetails?.curriculum.map(
                  (item) => (
                    <div
                      key={item._id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-700 cursor-pointer rounded-md"
                    >
                      {item.viewed ? (
                        <Check className="text-green-500" />
                      ) : (
                        <Play />
                      )}
                      <span>{item.title}</span>
                    </div>
                  )
                )}
              </TabsContent>

              <TabsContent value="overview" className="p-4">
                <ScrollArea className="h-full">
                  <h2 className="text-xl font-semibold">Course Details</h2>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </aside>
        </main>
      </div>
    </>
  );
}

export default StudentViewCourseProgressPage;
