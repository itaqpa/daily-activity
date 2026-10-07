import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import MainLayout from '../../../components/layouts/MainLayout';
import FormDailyInput from './FormDailyInput';
import { apiUrl } from '../../../api';

export default function FormDailyInputPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(apiUrl(`/install-projects/${id}`));
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        }
      } catch (err) {
        console.error('Error fetching project:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  const handleBack = () => {
    navigate(`/installation-project/${id}`);
  };

  return (
    <MainLayout>
      <div className="pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <FormDailyInput onBack={handleBack} project={project} />
        )}
      </div>
    </MainLayout>
  );
}
